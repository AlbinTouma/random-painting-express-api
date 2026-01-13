import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import axios from 'axios';

const PORT = 3000;
const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);


app.get("/", (req, res) => {
    let html = `
        <h1>Find your art</h1>
        <form id="form" >
            <input type="text" name="q"></input>
            <button type="submit"></button>
        </form>

        <img id="image"></img>

        <script>
            let form = document.querySelector('#form');
            form.addEventListener('submit', async (event) => {
                event.preventDefault()
                const formData = new FormData(event.target);
                const q = formData.get("q");
                let img = document.querySelector('#image');
                let url = "http://localhost:3000/search";
                let image; 

                try {
                image = await fetch(url, {
                "method": "POST",
                "headers": { "Content-Type": "application/json"},
                "body": JSON.stringify({q: q})
                });

                let imageResponse = await image.json();
                console.log(imageResponse);

                if (imageResponse.result == null){
                    console.log("image not found");
                    alert("Image not found");
                    }

                const imageUrl = imageResponse.result?.primaryImageSmall || imageResponse.result?.primaryImage;

                console.log(imageUrl);

                if (imageUrl){
                    img.src = imageUrl
                    } else {
                    alert("Image not found");
                }


                } catch (error){ 
                    console.log(error)
                    }

                })



        </script>
        `
    res.send(html)
});

async function getImage(objectId){
    return await axios.get(
        `https://collectionapi.metmuseum.org/public/collection/v1/objects/${objectId}`,{
            validateStatus: (status) => status < 500} 
    );
}

async function getImages(q){
    return await axios.get(
        `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${q}`,{
            validateStatus: (status) => status < 500}
    );
}

app.get("/img", async (req, res) => {
    let imageId = req.query.imageId;
    console.log(imageId);
    let response = await getImage(imageId);
    res.json({data: response.data}); 
});


// Search image -> response<imageObject> 
app.post("/search", async (req, res) => {
    let q = req.body.q;
    let response  = await getImages(q);
    console.log(response.status);
    console.log(response.data);
    if (response.status != 200 || response.data.objectIDs == null){
        return res.json({"status": response.status, "result": null});
    }
     
    let imageIds = response.data.objectIDs[0];
    response = await getImage(imageIds);
    if (response.status != 200 || response.data == null){
        return res.json({"status": response.status, "result": null});
    }
    return res.json({
        "status": response.status, 
        "total": response.data.total, 
        "result": response.data
    });
});


app.listen(3000, () => console.log('Server live on port 3000'));

