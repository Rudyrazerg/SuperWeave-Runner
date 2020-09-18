const arweave = Arweave.init({
    host:"arweave.net",
    port:443,
    logging:!0,
    protocol:"https"
});

sessionStorage.clear();
sessionStorage.setItem("ScoreRunGame", '0');

$('#savehighscore').click(function(){
    $('#openfiles').click();
});

$('#startgame').click(function(){
    $('.runner-canvas').click();
});

function savename() {
    var name = (document.getElementById('inputname').value).trim();
    if (name === '') {

    }else {
        name = name.slice(0,15);
        sessionStorage.setItem('superweavename', name);
        display('inputname','none');
        display('setName','none');
        display('savehighscore','block');
        
    }
}

function saveSuperWeaveScores(files) {
    var xfiles = new FileReader();
    xfiles.onload = async function (ev) {
       try {
           xar = JSON.parse(ev.target.result);
           var xsc = sessionStorage.getItem("ScoreRunGame");
           var xnm = sessionStorage.getItem("superweavename");

           display('status','block');
           display('statusc','none');
           display('statusb','none');

           var xrt = await goToData(xar, xnm , xsc);

           if (xrt === false) {
                display('status','none');
                display('statusc','block');
           }else {
                display('statusb','block');
                display('status','none');
           }

       } catch (err) {
           display('status','none');
           display('statusc','block');
       }
    }
    xfiles.readAsText(files[0])
}

async function goToData(r, m , c) {

    var d = Date.now();

    var xd = '{"name":"'+m+'","score":"'+c+'"}'
    try {
          let w =  await arweave.createTransaction({
              data: xd
          }, r)

          w.addTag('Content-Type', 'text/html');
          w.addTag('Perma-name', 'superweaverunner');
          w.addTag('Version', '1');
          w.addTag('Name', m);
          w.addTag('Score', c);
          w.addTag('Date', d);

         await arweave.transactions.sign(w, r);
         const response = await arweave.transactions.post(w);
         if (response.status === 200) {
            return true;
         }
    } catch (err) {
            return false;
    }
}

window.onload = async function getScores(){
    const scores = await arweave.arql({
         op: "and",
         expr1: {
           op: "equals",
           expr1: "Version",
           expr2: "1"
         },
         expr2: {
             op:"equals",
             expr1:"Perma-name",
             expr2:"superweaverunner"
         }
    })

    var c = scores.length;
    let h = [];
    scores.forEach(async function(i){

        try {
          const y = await arweave.transactions.get(i);
          const data = y.get('data', { decode: true, string: true });
          let xdata = JSON.parse(data);
          let scr = Number(xdata.score) / 100000000 ;
          let xtem = '{"name":"'+xdata.name+'","score":"'+scr+'"}';
          let otem = JSON.parse(xtem);
          h.push(otem);

          c -= 1;
          if (c === 0) {

              l = h.sort(turnOrder("-score"));
              l = h.slice(0,5);
              var num = 0;

              for (const i of l) {
                num += 1;
                var k = (Number(i.score) * 100000000) / 40;
                var t = '<tr><td width="50">'+num+'</td><td width="340">'+i.name+'</td><td width="200">'+Math.ceil(k)+'</td></tr>';
                $('#setScores').append(t);
              }

          }

        } catch (e) {
            c -= 1;
        }

    });
}

function turnOrder(p) {
    var s = 1;
    if(p[0] === "-") {
        s = -1;
        p = p.substr(1);
    }
    return function (a,b) {
        var r = (a[p] < b[p]) ? -1 : (a[p] > b[p]) ? 1 : 0;
        return r * s;
    }
}

function display(i,c) {
    document.getElementById(i).style.display = c;
}