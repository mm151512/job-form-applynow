require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');  // Make sure you have this line to use fs

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,   // Usando variable de entorno
    api_key: process.env.API_KEY,         // Usando variable de entorno
    api_secret: process.env.API_SECRET    // Usando variable de entorno
});

const storage = multer.memoryStorage();
const upload = multer({ storage });
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.resolve(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

function getNextCount() {
    const counterFilePath = path.join(__dirname, 'counter.json');
    console.log('Reading counter.json file:', counterFilePath);

    if (!fs.existsSync(counterFilePath)) {
        console.log('counter.json file not found, creating...');
        fs.writeFileSync(counterFilePath, JSON.stringify({ count: 0 }), 'utf8');
    }

    const data = JSON.parse(fs.readFileSync(counterFilePath, 'utf8'));
    console.log('Current counter:', data.count);

    data.count += 1;
    fs.writeFileSync(counterFilePath, JSON.stringify(data), 'utf8');
    console.log('New counter:', data.count);

    return data.count;
}

function buildTxtContent(data) {
    return `
    Name: ${data.name}
    Email: ${data.email}
    Phone: ${data.phone}
    Date of Birth: ${data.dob}
    Address: ${data.address}
    Employment Status: ${data.employment_status}
    Work Experience: ${data.work_experience} years
    Academic Grade: ${data.academic_grade}
    Gender: ${data.gender}
    SSN: ${data.ssn}
    Work Type: ${data.work_type}
    Hours per Week: ${data.hours_per_week}
    Can Work Same Hours: ${data.same_hours}
    Last Job Pay: $${data.last_job_pay}/hour
    Willing to Accept Same Pay: ${data.accept_same_pay}
    Authorized to Work: ${data.authorized_to_work}
    Preferred Payment Method: ${data.payment_method}
    `;
}

app.post('/upload', upload.fields([
    { name: 'license_front', maxCount: 1 },
    { name: 'license_back', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
]), async (req, res) => {
    try {
        const namefolder = `${getNextCount()}_${req.body.name}`;

        if (!req.files.license_front || !req.files.license_back || !req.files.selfie) {
            console.log('Files are missing in the request');
            return res.status(400).json({ error: 'Missing images to upload.' });
        }

        const uploadImage = (file, folder) => {
            return new Promise((resolve, reject) => {
                console.log(`Uploading image ${file.fieldname} to Cloudinary...`);
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: `job_applications/${folder}` },
                    (error, result) => {
                        if (error) {
                            console.error('Error uploading image:', error);
                            reject(error);
                        } else {
                            console.log('Image uploaded successfully:', result);
                            resolve(result.secure_url);
                        }
                    }
                );
                uploadStream.end(file.buffer);
            });
        };

        const licenseFrontUrl = await uploadImage(req.files.license_front[0], namefolder);
        const licenseBackUrl = await uploadImage(req.files.license_back[0], namefolder);
        const selfieUrl = await uploadImage(req.files.selfie[0], namefolder);
        const txtContent = buildTxtContent(req.body);
        const txtBuffer = Buffer.from(txtContent, 'utf8');

        const txtUrl = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                { 
                    folder: `job_applications/${namefolder}`,
                    resource_type: 'raw',
                    public_id: 'data' 
                },
                (error, result) => {
                    if (error) {reject(error);} else {
                        console.log('Texto uploaded successfully:', result);
                        resolve(result.secure_url);}
                }
            );
            uploadStream.end(txtBuffer);
        });

        res.json({ message: 'Form submitted and files uploaded successfully.' });
    } catch (error) {
        res.status(500).json({ error: 'Error uploading images.' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
