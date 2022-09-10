// ----- global variables -----

// list for keeping track of hidden elements (for undo functionality)
var hidden = [];


// ----- DOM Elements -----

const btnExtractPages = document.getElementById('extract-pages');
const btnHideSelected = document.getElementById('hide-selected');
const btnShowAll = document.getElementById('show-all');
const btnUndoHide = document.getElementById('undo-hide');
const btnSelectAll = document.getElementById('select-all');
const btnInvertSelection = document.getElementById('invert-selection');
const btnNewFile = document.getElementById('new-file');

const chkHideExtracted = document.getElementById('hide-extracted');
const chkChangeFilename = document.getElementById('change-filename');


const btnModalSaveFile = document.getElementById('modal-save-file');
const btnModalCancel = document.getElementById('modal-cancel');

const txtFileSelector = document.getElementById('file-selector');

const txtModalFileName = document.getElementById('file-name');

const myModal = document.getElementById('myModal');

const divDropZone = document.getElementById('drop-zone');



// enable bootstrap tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
})


// ----- events -----

// drag and drop file upload:
divDropZone.ondragover = function(ev) {
    console.log('File(s) in drop zone');
    ev.preventDefault();    // Prevent default behavior (Prevent file from being opened)
}


divDropZone.ondrop = function(ev) {
    console.log('File(s) dropped');
    ev.preventDefault();    // Prevent default behavior (Prevent file from being opened)

    // Use DataTransferItemList interface to access the file(s)
    for (let i = 0; i < ev.dataTransfer.items.length; i++) {
        // If dropped items aren't files, reject them
        if (ev.dataTransfer.items[i].kind === 'file') {
            const file = ev.dataTransfer.items[i].getAsFile();
            upload(file);
            return;     // return after first file
        }
    }
}
// -----


// file upload through file dialog:
txtFileSelector.onchange = function(event) {
    const file = event.target.files[0];
    upload(file);
};


// selecting and deselecting pages
$(document).on("click", ".thumbnail", function(){
    $(this).toggleClass("selected");
    $(this).children().toggleClass("bg-secondary");
    $(this).children().toggleClass("bg-success");
});


// extract pages button
btnExtractPages.onclick = function() {

    $('#extract-pages-spinner').show();

    // temporary variable for storing page numbers
    var pages = [];

    // get list of page numbers by iterating over selected pages
    document.querySelectorAll('.selected').forEach(function(item) {
        // push id (ie. page number beginninge with 1) to pages variable
        pages.push(item.id);
    });

    // querry string for request
    var dataString = "";

    // build querry string from list of pages
    for (i in pages) {
        if (i==0) {
            dataString = dataString + "page=" + pages[i];
        } else {
            dataString = dataString + "&page=" + pages[i];
        }
    }

    console.log('requesting file from Server');

    // make GET request for pdf file of extracted pages
    $.ajax({
        url: "/download",
        type: "GET",
        data: dataString,   // pass querry string
        xhrFields: {responseType: 'blob'},  // to avoid binary data being mangled on charset conversion
        success: function(data) {
            console.log('file request successful')

            // convert file response to blob
            var blob = new Blob([data], { type: "application/octetstream" });

            // download file
            download(blob);
        },
        error: function (request, status, error) {
            console.log('error while requesting file');
            console.log(request.responseText);
        }
    });
};


// hide selected pages button
btnHideSelected.onclick = function() {
    hideSelected();
}


// undo hidden pages button
btnUndoHide.onclick = function() {
    undoHidden();
}


// unhide all hidden pages button
btnShowAll.onclick = function() {
    while (hidden.length > 0) {
        undoHidden();
    }
}


// select or deselect all thumbnails
btnSelectAll.onclick = function() {
    // if there are thumbnails, that have not been selected, then select all unselected ones
    if (document.querySelectorAll('.thumbnail:not(.selected)').length) {
        document.querySelectorAll('.thumbnail:not(.selected)').forEach(function(item) {
            item.click();
        });
    }

    // else unselect all
    else {
        document.querySelectorAll('.selected').forEach(function(item) {
            item.click();
        });
    }
}


// invert current selection
btnInvertSelection.onclick = function() {
    // click on all thumbnails
    document.querySelectorAll('.thumbnail').forEach(function(item) {
        item.click();
    });
}


// enter a filename in modal
txtModalFileName.oninput = function() {
    if (txtModalFileName.value == "") {
        btnModalSaveFile.setAttribute('download', 'extracted.pdf');
    } else {
        btnModalSaveFile.setAttribute('download', txtModalFileName.value + '.pdf');
    }
}


// save file button
btnModalSaveFile.onclick = function() {
    // hide extracted pages
    if (chkHideExtracted.checked) { hideSelected(); }

    // hide modal and reset button attributes
    $('#myModal').modal('hide');
    btnModalSaveFile.removeAttribute('href');
    btnModalSaveFile.removeAttribute('download');
}


// new file button
btnNewFile.onclick = function() {
    $('#page-list').html('');
    $('#page-list').hide();
    $('#toolbar').hide();
    $('footer').hide();
    $('#drop-zone').show();
    hidden = [];
    txtModalFileName.value = '';
}


// enter key functionality:
document.onkeydown = function(event) {
    // if enter key is pressed
    if(event.key === 'Enter') {

        // if file naming modal is open:
        if ($('#myModal').is(":visible")) {
            // click the modal-save-file button
            btnModalSaveFile.click();
            console.log("save file");
        } else {
            // click the extract-pages button
            btnExtractPages.click();
            console.log("extract pages");
        }
    }
}


// ----- functions -----

/**
 * downloads the passed file
 * 
 * when change-filename is checked, the modal for naming the file will be opend
 * otherwise the file will be downloaded directly
 * 
 * @param {*} file The file to be downloaded
 */
 function download(file) {
    // download through file naming dialog:
    if (chkChangeFilename.checked) {
        // open modal and attach file to saveFile button
        btnModalSaveFile.setAttribute('href', URL.createObjectURL(file));
        btnModalSaveFile.setAttribute('download', 'extracted.pdf');
        $('#myModal').modal('show');
        
        
        // in case there is alredy text in textbox, move cursor to end
        txtModalFileName.setSelectionRange(txtModalFileName.value.length, txtModalFileName.value.length);
        // select textbox
        txtModalFileName.focus();
    }
    
    // download straight away
    else {
        // create a hidden link element containing the file
        var element = document.createElement('a');
        element.style.display = 'none';
        element.setAttribute('href', URL.createObjectURL(file));
        element.setAttribute('download', 'extracted.pdf');

        // append link element to  body
        document.body.appendChild(element);

        // click link to download file
        element.click();

        // remove link element
        document.body.removeChild(element);

        // hide extracted pages
        if (chkHideExtracted.checked) { hideSelected(); }
    }

    // hide download spinner
    $('#extract-pages-spinner').hide();
}



/**
 * Sends pdf file to the server using a post request,
 * on success the drop-zone will be hidden and 
 * the page-list will be loaded from the server
 * 
 * @param {*} file The file to be uploaded 
 */
function upload(file) {
    if (file.type == 'application/pdf') {
        $('#file-upload-spinner').show();
        const formData = new FormData();
        console.log('filename = ' + file.name);
        formData.append('file', file);
        $.ajax({
            url: '/', // <-- point to server-side PHP script 
            dataType: 'text',  // <-- what to expect back from the PHP script, if anything
            cache: false,
            contentType: false,
            processData: false,
            data: formData,
            type: 'post',
            success: function(response){
                console.log('file POST successful');
                $("#page-list").load("/images", function() {
                    // after images are loaded, drop-zone is hidden
                    $("#drop-zone").hide();
                    $('#file-upload-spinner').hide();
                    $('#page-list').show();
                    $('#toolbar').show();
                    $('footer').show();
                });
            },
            error: function (request, status, error) {
                console.log(request.responseText);
            }
        });
    } else {
        console.log('incorrect file type');
    }
}



/**
 * hides all DOM elements with the class 'selected',
 * also removes the class 'selected' from element
 */
function hideSelected() {
    // list of pages that are beeng hidden
    var lastHidden = [];

    // iterate over all DOM elements with the class 'selected'
    document.querySelectorAll('.selected').forEach(function(item) {
        lastHidden.push(item.id);   // add id of thumbnail to list of newly hidden pages
        item.style.display = 'none';    // hide page
        item.classList.remove('selected');  // remove the 'selected' class from element
    });

    // push list of newly hidden pages to the hidden variable
    hidden.push(lastHidden);
}


/**
 * unhide the latest hidden thumbnails and select them
 */
function undoHidden() {
    // check that there are still hidden elements
    if (hidden.length > 0) {

        // pop last item from list
        var lastHidden = hidden.pop();

        // iterate through all items of lastHidden and get the corresbonding DOM element
        for (var element of lastHidden) {
            document.getElementById(element).style.display = null;  // unhide element
            document.getElementById(element).classList.add('selected'); // select element
        }
    }
}