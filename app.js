const tools=[
["AI Background Remover","Remove backgrounds from photos with AI.","🪄","image"],
["Image Compressor","Reduce file size while keeping quality.","📉","image"],
["Image Resizer","Resize images to exact dimensions.","📏","image"],
["Image Converter","Convert PNG, JPG and WebP files.","🔄","image"],
["Image Upscaler (HD)","Upscale images for sharper output.","✨","image"],
["PDF Compressor","Shrink PDF size for easy sharing.","📦","pdf"],
["Word to PDF","Convert Word documents into PDF.","📝","pdf"],
["PDF to Word","Turn PDF documents into editable Word files.","📄","pdf"],
["Photo Colorize","Add realistic color to old photos.","🎨","image"],
["Photo Enhancer","Improve clarity, lighting and detail.","🔆","image"],
["PDF Merger","Combine multiple PDFs into one file.","🧩","pdf"],
["PDF Splitter","Extract selected PDF pages.","✂️","pdf"],
["QR Code Generator","Create a QR code from any text or URL.","▦","utility"],
["Password Generator","Generate strong secure passwords.","🔑","utility"],
["Barcode Generator","Create barcodes from text or numbers.","▥","utility"],
["Image Size Expander","Expand image canvas while preserving the subject.","↔️","image"]
];

const grid=document.getElementById("toolGrid"), search=document.getElementById("search"), count=document.getElementById("count");
let filter="all";
function render(){
 const q=search.value.toLowerCase();
 const list=tools.filter(t=>(filter==="all"||t[3]===filter)&&t[0].toLowerCase().includes(q));
 count.textContent=`${list.length} tools`;
 grid.innerHTML=list.map((t,i)=>`<article class="tool" onclick="openTool(${tools.indexOf(t)})"><div class="icon">${t[2]}</div><h3>${t[0]}</h3><p>${t[1]}</p><div class="tag">${t[3]}</div></article>`).join("");
}
document.querySelectorAll(".chips button").forEach(b=>b.onclick=()=>{document.querySelectorAll(".chips button").forEach(x=>x.classList.remove("active"));b.classList.add("active");filter=b.dataset.filter;render()});
search.oninput=render;

const modal=document.getElementById("modal"), content=document.getElementById("modalContent");
document.getElementById("close").onclick=()=>modal.classList.remove("show");
modal.onclick=e=>{if(e.target===modal)modal.classList.remove("show")};

function openTool(i){
 const [name,desc,icon,type]=tools[i];
 if(name==="Password Generator"){passwordTool();return}
 if(name==="QR Code Generator"){qrTool();return}
 content.innerHTML=`<div class="icon">${icon}</div><h2>${name}</h2><p style="color:var(--muted);line-height:1.7">${desc}</p>
 <div class="drop"><b>Choose your file</b><br><span style="color:var(--muted);font-size:13px">Drag & drop or browse from your device</span><br><input type="file" id="fileInput" accept="${type==='pdf'?'.pdf,.doc,.docx':'image/*'}"><br><button class="action" onclick="demoProcess()">Continue</button></div>
 <p style="font-size:11px;color:var(--muted);margin-top:15px">Starter UI: connect the corresponding processing API/server endpoint to enable production conversion or AI processing.</p>`;
 modal.classList.add("show");
}
function demoProcess(){const f=document.getElementById("fileInput").files[0];if(!f)return alert("Please choose a file first.");alert("File selected: "+f.name+"\\nProcessing endpoint can now be connected.");}
function passwordTool(){
 content.innerHTML=`<div class="icon">🔑</div><h2>Password Generator</h2><p style="color:var(--muted)">Create a strong random password.</p>
 <input id="pwLen" type="range" min="8" max="40" value="18" style="width:100%"><div style="margin:10px 0;color:var(--muted)">Length: <b id="len">18</b></div>
 <div class="search"><input id="pw" readonly value=""></div><button class="action" onclick="genPw()">Generate Password</button>`;
 modal.classList.add("show");genPw();document.getElementById("pwLen").oninput=e=>{document.getElementById("len").textContent=e.target.value;genPw()};
}
function genPw(){const el=document.getElementById("pw");if(!el)return;const n=+document.getElementById("pwLen").value, chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";let s="";for(let i=0;i<n;i++)s+=chars[Math.floor(Math.random()*chars.length)];el.value=s}
function qrTool(){
 content.innerHTML=`<div class="icon">▦</div><h2>QR Code Generator</h2><p style="color:var(--muted)">Enter text or a URL to create a QR code.</p><div class="search"><input id="qrText" placeholder="https://example.com"></div><button class="action" onclick="makeQR()">Generate QR</button><div id="qrOut" style="text-align:center;margin-top:20px"></div>`;
 modal.classList.add("show");
}
function makeQR(){
 const v=document.getElementById("qrText").value.trim(); if(!v)return;
 const out=document.getElementById("qrOut");
 out.innerHTML=`<img alt="QR code" width="220" height="220" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(v)}"><p style="font-size:12px;color:var(--muted)">QR image generated via external QR service.</p>`;
}
document.getElementById("themeBtn").onclick=()=>{document.body.classList.toggle("dark");document.getElementById("themeBtn").textContent=document.body.classList.contains("dark")?"☀":"☾"};
render();
