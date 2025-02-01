/**
 * @name 'Rename Selected Files'
 * @summary This script allows users to sync the names of files changed in Premiere's project panel to the source file.
 * @author Blake Fealy <blakefealy@gmail.com>
 * @version 1.5
 * @dependencies User must have project items selected that they want to push changes to.
 * @dateUpdated 2025-01-31
 */

var project = app.project;
var rootItem = project.rootItem;
var processedCount = 0;

runRenameSelection();

function runRenameSelection() {
    "use strict";
    var selection = app.getCurrentProjectViewSelection();
        if (selection.length > 0) {
            for (var s = 0; s < selection.length; s++) {
                var item = selection[s];
                processItem(item);
            }
                if(processedCount > 0) {
                    sdkMessage("Success: Source Clip Names Normalized \n\n Successfully renamed " + processedCount + " source clips", "info");
                    } else {
                        sdkMessage("Source Clip Names Unchanged \n\n" + processedCount + " source clips were renamed, \n" + "because it was determined that they already matched", "info");
                }
                return String(processedCount);
        } else {
            sdkMessage("Failure: \n Process Aborted (No Project Items Selected)!", "info");
            return "no selection";
    } 
}

// Function to process a project item (handles bins and footage)
function processItem(item) {
    if (item.canChangeMediaPath() === true) {
        // Process footage
        var renameProcess = renameSourceFile(item);
        renameTracks(item);
        if(renameProcess === "executed") { processedCount++; }
    } else if (item.type === 2) {
        // Process bin recursively
        for (var i = 0; i < item.children.numItems; i++) {
            processItem(item.children[i]);
        }
    }
}

function canChangeMediaPathTest(prjRootItem) {
    check = prjRootItem.canChangeMediaPath();
    return check;
}

// Function to rename the source file
function renameSourceFile(prjRootItem) {
    var prjItemName = prjRootItem.name;
    var mediaPath = prjRootItem.getMediaPath();
        if (mediaPath !== "" || mediaPath !== undefined) {
        var file = new File(mediaPath);
        var _FileInfo = {
            fullName: file.displayName,
            ext: file.name.split(".").pop(),
            path: file.parent.fsName + "/"
        };

        var prjExt = prjItemName.split(".").pop();
        var newName = (prjExt === _FileInfo.ext) ? prjItemName : prjItemName + "." + _FileInfo.ext;

        if (newName !== file.displayName) {
            prjRootItem.setOffline();
            $.sleep(500);
            
            if (file.rename(newName)) { 
                prjRootItem.changeMediaPath(_FileInfo.path + newName, true);
                prjRootItem.refreshMedia();
                return "executed";
            } else {
                return "rename failed";
            }
        } else {
            return "skipped";
        }
    } else {
        return "No media path found";
    }
}


// Function to rename tracks
function renameTracks(prjRootItem) {
    var linkedTrackItems = [];
    if (prjRootItem) {
        var sequences = app.project.sequences;

        // Iterate through all sequences
        for (var i = 0; i < sequences.numSequences; i++) {
            var sequence = sequences[i];

            // Iterate through video tracks
            for (var j = 0; j < sequence.videoTracks.numTracks; j++) {
                var track = sequence.videoTracks[j];
                for (var k = 0; k < track.clips.numItems; k++) {
                    var clip = track.clips[k];
                    if (clip.projectItem && clip.projectItem.nodeId === prjRootItem.nodeId) {
                        linkedTrackItems.push(clip);
                    }
                }
            }

            // Iterate through audio tracks
            for (var j = 0; j < sequence.audioTracks.numTracks; j++) {
                var track = sequence.audioTracks[j];
                for (var k = 0; k < track.clips.numItems; k++) {
                    var clip = track.clips[k];
                    if (clip.projectItem && clip.projectItem.nodeId === prjRootItem.nodeId) {
                        linkedTrackItems.push(clip);
                    }
                }
            }
        }
    }
    renameTrackItems(linkedTrackItems, prjRootItem.name);
}

// Function to rename track items
function renameTrackItems(trackItems, newName) {
    if (trackItems.length > 0) {
        for (var t = 0; t < trackItems.length; t++) {
            var item = trackItems[t];
            item.name = newName;
        }
    }
}

function sdkMessage(text, decorator) {
    app.setSDKEventMessage(text, decorator);
}

function renameJSX() {
    var newName = prompt("Enter the new project name:", String(app.project.name).substring(0, structuredClone.length -7));
    if (newName && newName !== app.project.name) {
        var newProjectPath = project.path.replace(project.name, newName) + ".prproj";
        $.write(newProjectPath);
        app.project.saveAs(String(newProjectPath));
        alert("Project saved as: " + newProjectPath);
    } else {
        alert("Project name is unchanged.");
    }
}

function getTrackNames() {
    var activeSequence = app.project.activeSequence;

    if (activeSequence) {
        var audioTracks = activeSequence.audioTracks;
        var videoTracks = activeSequence.videoTracks;

        var trackNames = []; // Corrected variable name

        // Collect video track names
        for (var i = 0; i < videoTracks.length; i++) {
            var trackName = videoTracks[i].name || "Video " + (i + 1); // Default if name is missing
            trackNames.push("v" + (i + 1) + ". " + trackName);
        }

        // Collect audio track names
        for (var i = 0; i < audioTracks.length; i++) {
            var trackName = audioTracks[i].name || "Audio " + (i + 1); // Default if name is missing
            trackNames.push("a" + (i + 1) + ". " + trackName);
        }

        // Return track names as a JSON string
        return JSON.stringify(trackNames);
    } else {
        return JSON.stringify({ error: "No active sequence found" });
    }
}

