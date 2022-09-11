# PDFSplit
This is a simple web-tool for selecting and extracting specific pages from a PDF file.

The tool consists of a python backend using Flask.
The PDF file is uploaded through the html frontend and sent to the flask server.
After Selecting the required pages, they are requested from the server.
The server uses the PyPDF2 library to extract the requested pages from the PDF and sends the new PDF file to the front end.
