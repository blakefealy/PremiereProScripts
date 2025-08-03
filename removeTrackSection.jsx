/**
 * @name Remove Track Section
 * @summary This script finds all the clips that are at the playhead and removes them unless they are on locked tracks.
 * @author Blake Fealy <blakefealy.com>
 * @version 1.0
 * @dependencies The script requires the user to select clips/files in the project window and requires those files to have a source file in the file explorer.
 * @updated 2025-08-02
 */


var project = app.project;
var sequence = project.activeSequence;
var sequenceID = sequence.projectItem.id;
var activeSequence = null;

//Find Matching Root Project to Active Sequence
if(project === null || project === undefined) {
    alert("No Project Open. Open A Project, Make Sure A Sequence Is Active, and Try Again.")
} else {
    if(sequence === null || sequence === undefined) {
        alert("No Active Sequence Detected.");
    } else {
        var activeSequence = findSequenceIndex(sequence);
    }
}

//Find Playhead Location on Sequence, Select Clips, and Remove Them From The Tracks.
if(activeSequence === null || activeSequence === undefined) {
    alert("No Matching Sequence Found");
} else {
    var removedResult = removeAllClipsAtPlayhead(activeSequence);
    var message = 'Clip Removal Report: ' + 'Sucessfully Removed ' + removedResult + ' clips from playhead location';
    app.setSDKEventMessage(message, 'info');
}



//--FUNCTIONS--

/*
* Function Removes All Clips At Playhead Position
* Requires: Sequence Index Object -- Dependencies: function getClipAtTicks()
*/
function removeAllClipsAtPlayhead(sequence) {
    var successDel = 0;
    var playheadPosition = Number(sequence.getPlayerPosition().ticks);
    var videoClips = getClipsAtTicks(sequence, playheadPosition, "videoTracks");
    var audioClips = getClipsAtTicks(sequence, playheadPosition, "audioTracks");
    var allClips = videoClips.concat(audioClips);
    if(allClips.length > 0) {
        for(var c = 0; c < allClips.length; c++) {
            var clipToRemove = allClips[c];
                var removeBoolean = clipToRemove.remove(0, 1);
                if(removeBoolean === true) {successDel++};
        }
    }
    return String(successDel) + "/" + String(allClips.length);   
}

/*
* Function returns an array of clips at a specific time in ticks. 
* Requires: Sequence Index Object, ticks number object, & track type as a string object i.e. videoTracks or audioTracks
*/
function getClipsAtTicks(sequence, ticksNumObj, trackTypeAsString) {
    var clipsArray = [];
    var seqConv = findSequenceIndex(sequence);
    var tracks = (trackTypeAsString === "videoTracks") ? seqConv.videoTracks : seqConv.audioTracks;
    if(tracks.numTracks > 0) {
        for(var t = 0; t < tracks.numTracks; t++) {
            var track = tracks[t];
            var clips = track.clips;
            if(clips.numItems > 0) {
                for(var c = 0; c < clips.numItems; c++) {
                    var clip = clips[c];
                    var inClip = Number(clip.inPoint.ticks);
                    var outClip = Number(clip.outPoint.ticks);
                    if(inClip < ticksNumObj && outClip > ticksNumObj) {
                        clipsArray.push(clip);
                    }
                }
            }
        }
    }
    return clipsArray;
}

/*
* Function takes a sequence object and returns the index path for that sequence
* Requires: Sequence Object (i.e. activeSequence)
*/
function findSequenceIndex (sequence){
    var returnSequence = null;
    var sequences = app.project.sequences;
    var id = sequence.id;
    if(sequences.numSequences > 0) {
        for(var s = 0; s < sequences.numSequences; s++) {
            var sequenceToMatch = sequences[s];
            var matchID = sequenceToMatch.id;
            if(id === matchID) {
                returnSequence = sequenceToMatch;
            }
        }
    }
    return returnSequence;
}



