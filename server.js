require('dotenv').config();
const multer = require('multer');
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fileSharing = require('./models/File');
const bodyParser = require('body-parser');

const app = express();
const upload=multer({dest:'uploads'});
app.use(bodyParser.urlencoded({ extended: true }))

mongoose.connect(process.env.DB_URL)
app.set('view engine','ejs')

app.get('/',(req,res)=>{
    res.render('index');
})
app.post('/uploaded',upload.single('file'),async (req,res)=>{
    const fileData = {
        path:req.file.path,
        originalName:req.file.originalname
    }
    if(req.body.pass!=null && req.body.pass!==""){
        fileData.password=await bcrypt.hash(req.body.pass,10);
    }
    const file = await fileSharing.create(fileData);
    res.render('index',{fileLink: `${req.headers.origin}/file/${file.id}`})
})

app.route("/file/:id").get(handleDownload).post(handleDownload)

async function handleDownload(req, res){
        const dwdfile = await fileSharing.findById(req.params.id);
        if (dwdfile.password != null) {
            if (req.body.pass == null) {
              res.render("password")
              return
            }
            if (!(await bcrypt.compare(req.body.pass, dwdfile.password))) {
                res.render("password", { error: true })
                return
              }
        }
        dwdfile.downloadCount++;
        await dwdfile.save();
        console.log(dwdfile.downloadCount);
        res.download(dwdfile.path, dwdfile.originalName);
}

app.listen(process.env.PORT,()=>{
    console.log('Server running on port 3000')
})