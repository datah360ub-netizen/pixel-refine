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
 const q=(search.value||"").toLowerCase().trim();
 const list=tools.filter(t=>(filter==="all"||t[3]===filter)&&(`${t[0]} ${t[1]}`).toLowerCase().includes(q));
 count.textContent=`${list.length} tools`;
 grid.innerHTML=list.map(t=>`<article class="tool" onclick="openTool(${tools.indexOf(t)})"><div class="icon">${t[2]}</div><h3>${t[0]}</h3><p>${t[1]}</p><div class="tag">${t[3]}</div></article>`).join("");
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
 const imageTool=["Image Compressor","Image Resizer","Image Converter","Image Size Expander"].includes(name);
 const accept=type==='pdf'?'.pdf,.doc,.docx':'image/*';
 content.innerHTML=`<div class="icon">${icon}</div><h2>${name}</h2><p style="color:var(--muted);line-height:1.7">${desc}</p>
 <div class="drop" id="dropZone"><div class="upload-icon">☁️</div><b>Upload your ${type==='pdf'?'document':'image'}</b><br><span style="color:var(--muted);font-size:13px">Tap to browse or drag & drop a file here</span><br><input type="file" id="fileInput" accept="${accept}" aria-label="Choose file">
 <div id="fileInfo" class="file-info">No file selected</div><div id="previewBox" class="preview-box"></div><div id="toolControls"></div><div id="status" class="status"></div></div>`;
 modal.classList.add("show");
 const input=document.getElementById("fileInput"), zone=document.getElementById("dropZone");
 input.addEventListener("change",()=>handleFile(input.files[0],name));
 ["dragenter","dragover"].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add("dragging")}));
 ["dragleave","drop"].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove("dragging")}));
 zone.addEventListener("drop",e=>{const f=e.dataTransfer.files[0];if(f){input.files=e.dataTransfer.files;handleFile(f,name)}});
 if(imageTool) setupImageControls(name);
}

function setupImageControls(name){
 const c=document.getElementById("toolControls");
 if(name==="Image Compressor") c.innerHTML=`<label class="control-label">Quality <span id="qualityValue">80%</span></label><input id="quality" type="range" min="10" max="95" value="80" class="control-range"><button class="action" onclick="processImage()">Compress & Download</button>`;
 if(name==="Image Resizer") c.innerHTML=`<div class="control-row"><label>Width <input id="resizeW" type="number" min="1" placeholder="Auto"></label><label>Height <input id="resizeH" type="number" min="1" placeholder="Auto"></label></div><button class="action" onclick="processImage()">Resize & Download</button>`;
 if(name==="Image Converter") c.innerHTML=`<label class="control-label">Output format</label><select id="format" class="select"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select><button class="action" onclick="processImage()">Convert & Download</button>`;
 if(name==="Image Size Expander") c.innerHTML=`<div class="control-row"><label>Extra width <input id="expandW" type="number" min="0" value="200"></label><label>Extra height <input id="expandH" type="number" min="0" value="200"></label></div><button class="action" onclick="processImage()">Expand & Download</button>`;
 const q=document.getElementById("quality"); if(q)q.oninput=()=>document.getElementById("qualityValue").textContent=q.value+"%";
}

let currentFile=null,currentTool="";
function handleFile(file,name){
 if(!file)return;
 currentFile=file;currentTool=name;
 const info=document.getElementById("fileInfo"), status=document.getElementById("status"), preview=document.getElementById("previewBox");
 info.textContent=`✓ ${file.name} • ${formatBytes(file.size)}`; status.innerHTML=`<span class="success-dot"></span> File ready — choose an action below.`;
 preview.innerHTML="";
 if(file.type.startsWith("image/")){const url=URL.createObjectURL(file);const img=document.createElement("img");img.src=url;img.alt="Selected image preview";img.onload=()=>URL.revokeObjectURL(url);preview.appendChild(img)}
 else preview.innerHTML=`<div class="doc-preview">📄<span>${file.type||"Document"}</span></div>`;
}
function formatBytes(bytes){if(bytes<1024)return bytes+" B";if(bytes<1024*1024)return (bytes/1024).toFixed(1)+" KB";return (bytes/1024/1024).toFixed(2)+" MB"}
function processImage(){
 if(!currentFile)return showStatus("Please choose an image first.",true);
 if(!currentFile.type.startsWith("image/"))return showStatus("This tool requires an image file.",true);
 const img=new Image(), url=URL.createObjectURL(currentFile); img.onload=()=>{URL.revokeObjectURL(url);let w=img.naturalWidth,h=img.naturalHeight;
  if(currentTool==="Image Resizer"){const rw=parseInt(document.getElementById("resizeW").value),rh=parseInt(document.getElementById("resizeH").value);if(!rw&&!rh)return showStatus("Enter a width or height.",true);if(rw&&rh){w=rw;h=rh}else if(rw){w=rw;h=Math.round(img.naturalHeight*(rw/img.naturalWidth))}else{h=rh;w=Math.round(img.naturalWidth*(rh/img.naturalHeight))}}
  if(currentTool==="Image Size Expander"){w+=Math.max(0,parseInt(document.getElementById("expandW").value)||0);h+=Math.max(0,parseInt(document.getElementById("expandH").value)||0)}
  const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;const ctx=canvas.getContext("2d");
  if(currentTool==="Image Size Expander"){ctx.fillStyle="#ffffff";ctx.fillRect(0,0,w,h);const x=Math.round((w-img.naturalWidth)/2),y=Math.round((h-img.naturalHeight)/2);ctx.drawImage(img,x,y)}else ctx.drawImage(img,0,0,w,h);
  let mime=currentTool==="Image Converter"?document.getElementById("format").value:(currentTool==="Image Compressor"?"image/jpeg":(currentFile.type||"image/png"));
  let quality=currentTool==="Image Compressor"?(parseInt(document.getElementById("quality").value)||80)/100:0.92;
  canvas.toBlob(blob=>{if(!blob)return showStatus("Could not create the output file.",true);const ext=mime==="image/jpeg"?"jpg":mime==="image/webp"?"webp":"png";downloadBlob(blob,`pixel-refine-${currentTool.toLowerCase().replace(/[^a-z0-9]+/g,"-")}.${ext}`);showStatus(`✓ Done — output size ${formatBytes(blob.size)}. Download started.`)},mime,quality);
 }; img.onerror=()=>{URL.revokeObjectURL(url);showStatus("This image could not be opened by the browser.",true)};img.src=url;
}
function downloadBlob(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function showStatus(msg,error=false){const s=document.getElementById("status");if(s)s.innerHTML=`<span class="${error?'error-dot':'success-dot'}"></span> ${msg}`}

function unsupportedProcess(){if(!currentFile)return showStatus("Please choose a file first.",true);showStatus("File is ready. This advanced tool needs its secure processing service to complete the operation.",false)}
function passwordTool(){
 content.innerHTML=`<div class="icon">🔑</div><h2>Password Generator</h2><p style="color:var(--muted)">Create a strong random password directly in your browser.</p><input id="pwLen" type="range" min="8" max="40" value="18" style="width:100%"><div style="margin:10px 0;color:var(--muted)">Length: <b id="len">18</b></div><div class="search"><input id="pw" readonly value=""></div><button class="action" onclick="genPw()">Generate Password</button>`;
 modal.classList.add("show");genPw();document.getElementById("pwLen").oninput=e=>{document.getElementById("len").textContent=e.target.value;genPw()};
}
function genPw(){const el=document.getElementById("pw");if(!el)return;const n=+document.getElementById("pwLen").value,chars="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*";let s="";for(let i=0;i<n;i++)s+=chars[Math.floor(Math.random()*chars.length)];el.value=s}
function qrTool(){content.innerHTML=`<div class="icon">▦</div><h2>QR Code Generator</h2><p style="color:var(--muted)">Enter text or a URL to create a QR code.</p><div class="search"><input id="qrText" placeholder="https://example.com"></div><button class="action" onclick="makeQR()">Generate QR</button><div id="qrOut" style="text-align:center;margin-top:20px"></div>`;modal.classList.add("show")}
function makeQR(){const v=document.getElementById("qrText").value.trim();if(!v)return;const out=document.getElementById("qrOut");out.innerHTML=`<img alt="QR code" width="220" height="220" src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(v)}"><p style="font-size:12px;color:var(--muted)">QR image generated.</p>`}
document.getElementById("themeBtn").onclick=()=>{document.body.classList.toggle("dark");document.getElementById("themeBtn").textContent=document.body.classList.contains("dark")?"☀":"☾"};
render();    
