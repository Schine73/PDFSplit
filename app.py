from flask import Flask, flash, request, redirect, render_template, session, send_file
from pdf2image import convert_from_path
from PyPDF2 import PdfFileReader, PdfFileWriter

from os import listdir, remove, path, environ
import base64
from io import BytesIO

from datetime import datetime
from time import strftime



app = Flask(__name__)

app.config['SECRET_KEY'] = '78e3f2df99ba9479792da7fa3827621ccf0218b39da13745281077aa14e70e44'
app.config['UPLOAD_FOLDER'] = 'uploads'



@app.route('/', methods=['GET', 'POST'])
def index():
    """ / is the home page and is also used for submitting the pdf file in a POST request """
    
    # pdf file will be sent with POST request
    if request.method == 'POST':
        
        # check that a file has been sent with the POST request
        if 'file' in request.files:
            
            # get file from request
            file = request.files['file']        
            
            # check that a file has been selected by the user
            if file.filename != '':
                
                # check that filetype is pdf
                if file.filename.rsplit('.')[-1].lower() in ['pdf']:
                    
                    # loop through upload folder and delete every file except latest 5 (ie. only keep last 5 elements in list)
                    files = listdir(app.config["UPLOAD_FOLDER"])
                    for i in range(len(files)):
                        if i <= len(files) - 5:
                            remove(path.join(app.config["UPLOAD_FOLDER"], files[i]))
                    
                    # save the file to the UPLOAD_FOLDER with timestamp
                    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                    filePath = path.join(app.config["UPLOAD_FOLDER"], timestamp + ".pdf")
                    file.save(filePath)
                    
                    # store file path in session variable
                    session['filePath'] = filePath
                    
                    return redirect(request.url), 201
                
                else:   # submitted file was not a pdf
                    flash('incorrect file type')
                    print('incorrect file type')
                    return redirect(request.url), 422
                
            else:   # no file has been selected by the user
                flash('no file selected')
                print('no file selected')
                return redirect(request.url), 422
        
        else:   # no file has been sent with the POST request
            flash('no file part')
            print('no file part')
            return redirect(request.url), 422
        
    else:   # on GET request render index page
        return render_template('index.html'), 200



@app.route('/images', methods=['GET'])
def images():
    """ /images page is used for fetching page thumbnails from server """
    
    # check if session variable contains a file path
    if 'filePath' in session:
        
        # check if file still exists on the server
        if path.exists(session['filePath']):
            
            # get images from file path using pdf2image library
            pdfImages = convert_from_path(session['filePath'], dpi=50)
            
            images = []     # create empty list for storing images
            
            for element in pdfImages:
                buffered = BytesIO()            # create a temporary buffer object
                element.save(buffered, 'JPEG')  # store image of current page in buffer object
                images.append(base64.b64encode(buffered.getvalue()).decode())   # encode image from buffer object in base64 and append to images list
            
            # send list of images in base64 to images.html template and return
            return render_template('image.html', images = images), 201
    
        else:   # file nolonger exists on server
            flash('file not found')
            print('file not found')
            return 'file not found', 404
    
    else:   # session variable is empty, no file has been submittet to /
        flash('no file submitted jet')
        print('no file submitted jet')
        return 'no file submitted jet', 404



@app.route('/download', methods=['GET'])
def download():
    """ /download page is used to request specific pages from the original pdf as one pdf 
        this is done through a GET request and one or multiple 'page' parameters in the querry string """
    
    # check if a page parameter has been given
    if 'page' in request.args:
        
        # check if session variable contains a file path
        if 'filePath' in session:
            
            # check if file still exists on the server
            if path.exists(session['filePath']):
                
                # obtain list of pages from request parameters,
                # convert every value to int and subtract 1 to convert from page nr. to page index
                pages = [int(i) - 1 for i in request.args.getlist('page')]
                
                # sort pages lowest to highest so the final pdf has the same order as original,
                # order of request parameters is thus disregarded
                pages.sort()
                
                # create object for reading pdf file
                reader = PdfFileReader(session['filePath'])
                
                # check that all requested pages are available in pdf
                # ( < because pages is index and len(reader.pages) is actual nr of pages)
                if pages[-1] < len(reader.pages):
                    
                    # initiate object for creating new pdf file from requested pages
                    writer = PdfFileWriter()
                    
                    # add every requested page to the new pdf file
                    for i in pages:
                        writer.addPage(reader.getPage(i))
                    
                    buffered = BytesIO()    # create temporary buffer object for storing new pdf file
                    writer.write(buffered)  # store new pdf file in buffer object
                    buffered.seek(0)        # go back to beginning of file ater writing
                    
                    # send buffered pdf file to client
                    return send_file(buffered, mimetype='application/pdf', download_name=(session['filePath'].split('\\')[-1])), 201

                else:   # a requested page nr was larger than the length of the pdf file
                    flash('requested page out of bounds')
                    print('requested page out of bounds')
                    return 'requested page out of bounds', 404
                
            else:   # file nolonger exists on server
                flash('file not found')
                print('file not found')
                return 'file not found', 404
                    
        else:   # session variable is empty, no file has been submittet to /
            flash('no file submitted jet')
            print('no file submitted jet')
            return 'no file submitted jet', 404
    
    else:   # no page parameter has been given
        flash('no page parameter given')
        print('no page parameter given')
        return 'no page parameter given', 406



if __name__ == '__main__':
    port = int(environ.get('PORT', 5000))
    app.run(host='0.0.0.0', debug=True, port=port)