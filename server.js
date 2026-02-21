const express = require("express");
const ytdl = require("ytdl-core");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();

app.get("/", (req,res)=>{
  res.send("YT Downloader Server Running...");
});


app.get("/download", async (req,res)=>{

  try{

    const url = req.query.url;
    const format = req.query.format || "mp4";
    const quality = req.query.quality || "360";

    if(!url || !ytdl.validateURL(url)){
      return res.status(400).send("Invalid URL");
    }

    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title.replace(/[^\w\s]/gi,"");

    /* ================= MP4 ================= */
    if(format === "mp4"){

      const video = ytdl(url,{
        quality: "highestvideo"
      });

      const audio = ytdl(url,{
        quality: "highestaudio"
      });

      res.header("Content-Disposition", `inline; filename="${title}.mp4"`);
      res.header("Content-Type","video/mp4");

      ffmpeg()
        .input(video)
        .input(audio)
        .videoCodec("libx264")
        .audioCodec("aac")
        .format("mp4")
        .outputOptions([
          "-preset fast"
        ])
        .pipe(res,{end:true});
    }

    /* ================= MP3 ================= */
    else{

      res.header("Content-Disposition", `attachment; filename="${title}.mp3"`);
      res.header("Content-Type","audio/mpeg");

      ffmpeg(ytdl(url,{
        quality:"highestaudio"
      }))
      .audioBitrate(quality === "320" ? 320 : 128)
      .format("mp3")
      .pipe(res,{end:true});
    }

  }catch(err){
    console.log(err);
    res.status(500).send("Error processing video");
  }

});


const PORT = process.env.PORT || 3000;
app.listen(PORT, ()=>{
  console.log("Server running on port "+PORT);
});
