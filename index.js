var express = require("express")
const r  = require("async-request")
const request  = require("request")
var port = process.env.PORT || 3000
var app = express()

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get("/get_info", (req, res) => {
    if(req.query.link.indexOf("apple.com") > 0){
        getAppleMusic(req.query.link, (data) => res.json(data))
    }else if(req.query.link.indexOf("music.yandex.ru/") > 0){
        var add_char = ""
        if(!Number(req.query.link[req.query.link.length-1])){
            add_char = "/3"
        }
        getYandexMusic(req.query.link+add_char, (data) => res.json(data))
    }else if(req.query.link.indexOf("spotify.com/") > 0){
        getSpotify(req.query.link, (data) => res.json(data))
    }else if(req.query.link.indexOf("youtube") > 0){
        getYoutube(req.query.link, (data) => res.json(data))
    }else if(req.query.link.indexOf("vk.com/audio") > 0){
        getVK(req.query.link, (data) => res.json(data))
    }else{
        res.json({type: "bad_link"})
    }
})

let getAppleMusic = (link, func) => {
    var id = link.split("playlist")[1].split("/")[2].split("?")[0]
    var options = {
        method: 'GET',
        url: 'https://api.music.apple.com/v1/catalog/us/playlists/'+id,
        qs: {l: 'en'},
        headers: {
          authorization: 'Bearer eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IldlYlBsYXlLaWQifQ.eyJpc3MiOiJBTVBXZWJQbGF5IiwiaWF0IjoxNTcwNTY0ODgxLCJleHAiOjE1ODYxMTY4ODF9.HZxouoWyDEil-S1UOVR_5T_3vmIwi2WD86wDUkarWVjpglykhMdRGmpJSxGWHRg_6gSawEO4Si5Xkcol8GRNnQ'
        }
      };

    let callback = (error, response, body) => {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body).data[0].relationships.tracks.data.map((item) => 
                {
                    return {
                        "track_name": item.attributes.name,
                        "artist": [{name: item.attributes.artistName}],
                        "genre": item.attributes.genreNames.map((g) => {
                            return {
                                "text": g.toLowerCase()
                            }
                        })
                    };
                }
            )
            func(data)
        }else{
            func(null)
        }
    }

    request(options, callback);
}

let getYandexMusic = (link, func) => {
    var arr = link.split("/users/")[1].split("/playlists/")
    console.log(arr)
    var options = {
        method: 'GET',
        url: `https://music.yandex.ru/handlers/playlist.jsx?owner=${arr[0]}&kinds=${arr[1]}&light=true&madeFor=&withLikesCount=true&lang=ru&external-domain=music.yandex.ru&overembed=false&ncrnd=0.4442184799316169`,
      };

    let callback = (error, response, body) => {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body).playlist.tracks.map((item) => 
                {
                    return {
                        "track_name": item.title,
                        "artist": item.artists.map((art) => {{
                            return {
                                "name": art.name
                            }
                        }}),
                        "genre": item.albums.map((gen) => {
                            return {
                                "text": gen.genre
                            }
                        })
                    };
                }
            )
            func(data)
        }else{
            func(null)
        }
    }

    request(options, callback);
}

let getSpotify = (link, func) => {
    var jar = request.jar();
    jar.setCookie(request.cookie("PHPSESSID=kfofo20enl22mmmbh4rsdbh0ibdk66u9"), "https://mysterious-plateau-80675.herokuapp.com/");

    var options = {
      method: 'GET',
      url: 'https://mysterious-plateau-80675.herokuapp.com/',
      qs: {
        url: link.indexOf("?si") > 0 ? link : link+"?si=1332"
      },
      jar: 'JAR'
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      func(JSON.parse(body).map((item) => {{
          return {
              "track_name": item.track_name,
              "artist": item.artist,
              "genre": !item.genres ? [] : item.genres
          }
      }}))
    });
}

let getYoutube = (link, func) => {
    var jar = request.jar();
    jar.setCookie(request.cookie("PHPSESSID=kfofo20enl22mmmbh4rsdbh0ibdk66u9"), "https://mysterious-plateau-80675.herokuapp.com/youtube.php");

    var options = {
      method: 'GET',
      url: 'https://mysterious-plateau-80675.herokuapp.com/youtube.php',
      qs: {
        url: link
      },
      jar: 'JAR'
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      func(JSON.parse(body).map((item) => {{
          return {
              "track_name": item.track_name,
              "artist": item.artist,
              "genre": !item.genres ? [] : item.genres
          }
      }}))
    });
}

let getVK = (link, func) => {
    var jar = request.jar();
    jar.setCookie(request.cookie("PHPSESSID=kfofo20enl22mmmbh4rsdbh0ibdk66u9"), "https://mysterious-plateau-80675.herokuapp.com/vk.php");

    var options = {
      method: 'GET',
      url: 'https://mysterious-plateau-80675.herokuapp.com/vk.php',
      qs: {
        url: link
      },
      jar: 'JAR'
    };

    request(options, function (error, response, body) {
      if (error) throw new Error(error);
      func(JSON.parse(body).map((item) => {{
          return {
              "track_name": item.track_name,
              "artist": [{name: item.artist}],
              "genre": !item.genres ? [] : item.genres
          }
      }}))
    });
}

app.listen(port, async () => {
    console.log("Server listening on port", port)
})