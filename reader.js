const fs = require('fs');
const path = require('path');

const listDirectories = (dir) => {
    const ps = new Promise((resolve, reject) => {
        fs.readdir(dir, { encoding: 'utf-8' }, (err, files) => {
            if (err) {
                reject(err);
            }
            resolve(files)
        })
    })
    return ps;
}

const returnArrayLinesFromFile = (dir,file) => {
    const ps = new Promise((resolve,reject) => {
        const safx = String(file).replace('.txt','').toUpperCase();
        const jsonObject = {safx,
                            registros: []};
        
        fs.readFile(path.join(dir,file),{encoding: 'utf-8'}, (err, data) => {
            if(err){
                reject(err);
            }

            const objLines = data.toString().replace(/\r/g,'').replace(/\t/g,'|').split('\n');
            
            objLines.forEach((line) => {
                if(line.trim()){
                    jsonObject.registros.push({linha: line});
                }
            });
            resolve(jsonObject);            
        })
    })
    return ps;
}

const exportToFile = (dir,text) => {
    const ps = new Promise((resolve, reject) => {
        fs.writeFile(dir,text, 'utf8', (error) => {
            if(error){
                console.log(error);
            }
        });
    })
    return ps;
}

const executeJob = async (dir) => {
    const files = await listDirectories(dir);
    const allReader = await Promise.all(files.map(file => returnArrayLinesFromFile(dir,file)));
    return allReader;
}

module.exports = {executeJob, exportToFile};
