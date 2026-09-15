/* Pixel Refine — client-side image tools */
const tools = [
  ["AI Background Remover","Remove backgrounds from photos with AI.","🪄","image","advanced"],
  ["Image Compressor","Reduce file size with adjustable quality.","📉","image","compress"],
  ["Image Resizer","Resize to exact pixels with aspect-ratio lock.","📏","image","resize"],
  ["Image Cropper","Crop to 1:1, 4:5, 3:4, 16:9 or custom pixels.","✂️","image","crop"],
  ["Image Converter","Convert JPG, PNG and WebP formats.","🔄","image","convert"],
  ["Image Upscaler (HD)","Enlarge images with browser-based scaling.","✨","image","upscale"],
  ["Photo Colorize","Add color to black-and-white photos.","🎨","image","advanced"],
  ["Photo Enhancer","Tune brightness, contrast and saturation.","🔆","image","enhance"],
  ["Magic Eraser","Erase unwanted areas with a brush and transparent PNG output.","🪄","image","eraser"],
  ["Image Size Expander","Add canvas space around the original image.","↔️","image","expand"],
  ["PDF Compressor","Shrink PDF size for easier sharing.","📦","pdf","advanced"],
  ["Word to PDF","Convert Word documents into PDF.","📝","pdf","advanced"],
  ["PDF to Word","Turn PDF documents into editable Word files.","📄","pdf","advanced"],
  ["PDF Merger","Combine multiple PDFs into one file.","🧩","pdf","advanced"],
  ["PDF Splitter","Extract selected PDF pages.","✂️","pdf","advanced"],
  ["QR Code Generator","Create QR codes from text or URLs.","▦","utility","qr"],
  ["Password & Barcode Generator","Generate secure passwords or simple Code 39 barcodes.","🔑","utility","utility"]
];

tools.push(
  ["Image Rotator & Flipper","Rotate 90°, 180° or 270° and flip images horizontally or vertically.","🔁","image","rotate"],
  ["Image Watermark","Add custom text watermark with size, opacity and position controls.","©️","image","watermark"],
  ["Image to PDF","Convert an image into a downloadable PDF document.","🖼️","pdf","advanced"],
  ["PDF to JPG","Convert PDF pages to JPG images.","📑","pdf","advanced"],
  ["PDF Page Extractor","Extract selected pages from a PDF.","📚","pdf","advanced"],
  ["PDF Page Numbering","Add page numbers to PDF documents.","🔢","pdf","advanced"],
  ["PDF Protect","Add password protection to a PDF.","🔐","pdf","advanced"],
  ["Image Metadata Cleaner","Prepare images for metadata/privacy cleaning.","🧹","image","advanced"]
);
const grid=document.getElementById('toolGrid');
const search=document.getElementById('search');
const count=document.getElementById('count');
let filter='all', currentFile=null, currentTool=null, imageState=null;

function render(){
  const q=(search.value||'').toLowerCase().trim();
  const list=tools.filter(t=>(filter==='all'||t[3]===filter)&&(`${t[0]} ${t[1]}`).toLowerCase().includes(q));
  count.textContent=`${list.length} tools`;
  grid.innerHTML=list.map(t=>{
    const i=tools.indexOf(t);
    return `<article class="tool" data-index="${i}"><div class="icon">${t[2]}</div><h3>${t[0]}</h3><p>${t[1]}</p><div class="tag">${t[3]}</div></article>`;
  }).join('');
  grid.querySelectorAll('.tool').forEach(card=>card.addEventListener('click',()=>openTool(+card.dataset.index)));
}

document.querySelectorAll('.chips button').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.chips button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active'); filter=b.dataset.filter; render();
}));
search.addEventListener('input',render);

const modal=document.getElementById('modal'), content=document.getElementById('modalContent');
document.getElementById('close').onclick=closeModal;
modal.addEventListener('click',e=>{if(e.target===modal)closeModal()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
function closeModal(){modal.classList.remove('show'); currentFile=null; imageState=null;}

function openTool(index){
  const t=tools[index]; currentTool=t; currentFile=null; imageState=null;
  if(t[4]==='password') return passwordTool();
  if(t[4]==='qr') return qrTool();
  if(t[4]==='barcode') return barcodeTool();
  if(t[4]==='utility') return utilityTool();
  const accept=t[3]==='pdf'?'.pdf,.doc,.docx':'image/*';
  content.innerHTML=`
    <div class="tool-modal-head"><div class="icon">${t[2]}</div><div><h2>${t[0]}</h2><p>${t[1]}</p></div></div>
    <div class="drop" id="dropZone">
      <div class="upload-icon">☁️</div>
      <b>Upload your ${t[3]==='pdf'?'document':'image'}</b>
      <br><span class="upload-hint">Tap to browse or drag & drop</span>
      <input type="file" id="fileInput" accept="${accept}" aria-label="Choose file">
      <div id="fileInfo" class="file-info">No file selected</div>
      <div id="previewBox" class="preview-box"></div>
      <div id="toolControls"></div>
      <div id="status" class="status"></div>
    </div>`;
  modal.classList.add('show');
  const input=document.getElementById('fileInput'), zone=document.getElementById('dropZone');
  input.addEventListener('change',()=>handleFile(input.files[0]));
  ['dragenter','dragover'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.add('dragging')}));
  ['dragleave','drop'].forEach(ev=>zone.addEventListener(ev,e=>{e.preventDefault();zone.classList.remove('dragging')}));
  zone.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f){handleFile(f);}});
  setupControls(t[4],t[3]);
  setTimeout(enhanceRatios,0);
}

function setupControls(mode,type){
  const c=document.getElementById('toolControls'); if(!c)return;
  if(type==='pdf'){
    c.innerHTML=`<div class="info-panel"><b>PDF processing</b><span>Select your file first. Browser-supported PDF actions can be connected here; advanced conversion/compression may require a backend/API.</span></div><button class="action secondary-action" id="advancedAction">Continue</button>`;
    document.getElementById('advancedAction').onclick=()=>showStatus('Your file is selected. Connect a PDF processing service to complete this operation.',false); return;
  }
  const commonAction=(label,fn)=>{c.innerHTML+=`<button class="action" id="mainAction" disabled>${label}</button>`;document.getElementById('mainAction').onclick=()=>{if(spendCoin())fn()}};
  if(mode==='compress'){
    c.innerHTML=`<div class="control-group"><label>Quality <output id="qualityValue">80%</output></label><input id="quality" type="range" min="10" max="100" value="80"></div><div class="control-row"><label>Format<select id="format"><option value="image/jpeg">JPG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></label></div>`; commonAction('Compress & Download',processImage);
    document.getElementById('quality').oninput=e=>document.getElementById('qualityValue').textContent=e.target.value+'%';
  }
  if(mode==='resize'){
    c.innerHTML=`<div class="ratio-grid"><button data-r="original" class="ratio active">Original</button><button data-r="1:1" class="ratio">1:1</button><button data-r="4:5" class="ratio">4:5</button><button data-r="16:9" class="ratio">16:9</button></div><div class="control-row"><label>Width (px)<input id="resizeW" type="number" min="1" placeholder="Width"></label><label>Height (px)<input id="resizeH" type="number" min="1" placeholder="Height"></label></div><label class="check"><input id="lockRatio" type="checkbox" checked> Lock aspect ratio</label><div class="live-size" id="liveSize">Upload an image to see dimensions</div>`; commonAction('Resize & Download',processImage); setupResizeLogic();
  }
  if(mode==='crop'){
    c.innerHTML=`<div class="ratio-grid"><button data-crop="free" class="ratio active">Free</button><button data-crop="1:1" class="ratio">1:1</button><button data-crop="4:5" class="ratio">4:5</button><button data-crop="3:4" class="ratio">3:4</button><button data-crop="16:9" class="ratio">16:9</button><button data-crop="9:16" class="ratio">9:16</button></div><div class="control-row"><label>X (px)<input id="cropX" type="number" min="0" value="0"></label><label>Y (px)<input id="cropY" type="number" min="0" value="0"></label></div><div class="control-row"><label>Width (px)<input id="cropW" type="number" min="1" value="100"></label><label>Height (px)<input id="cropH" type="number" min="1" value="100"></label></div><div class="live-size" id="cropInfo">Upload an image to set crop pixels</div>`; commonAction('Crop & Download',processImage); setupCropLogic();
  }
  if(mode==='convert'){
    c.innerHTML=`<label class="control-group">Output format<select id="format"><option value="image/jpeg">JPG</option><option value="image/png">PNG</option><option value="image/webp">WebP</option></select></label><div class="control-group"><label>Quality <output id="qualityValue">92%</output></label><input id="quality" type="range" min="10" max="100" value="92"></div>`; commonAction('Convert & Download',processImage); document.getElementById('quality').oninput=e=>document.getElementById('qualityValue').textContent=e.target.value+'%';
  }
  if(mode==='upscale'){
    c.innerHTML=`<div class="ratio-grid"><button class="ratio active" data-scale="2">2× HD</button><button class="ratio" data-scale="3">3×</button><button class="ratio" data-scale="4">4×</button></div><div class="info-panel"><b>Browser upscaling</b><span>Best for moderate-size images. Very large images may use more memory.</span></div>`; commonAction('Upscale & Download',processImage); document.querySelectorAll('[data-scale]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-scale]').forEach(x=>x.classList.remove('active'));b.classList.add('active')});
  }
  if(mode==='enhance'||mode==='editor'){
    c.innerHTML=`<div class="control-group"><label>Brightness <output id="brightV">0</output></label><input id="bright" type="range" min="-100" max="100" value="0"></div><div class="control-group"><label>Contrast <output id="contrastV">0</output></label><input id="contrast" type="range" min="-100" max="100" value="0"></div><div class="control-group"><label>Saturation <output id="satV">0</output></label><input id="sat" type="range" min="-100" max="100" value="0"></div><div class="control-group"><label>Blur <output id="blurV">0px</output></label><input id="blur" type="range" min="0" max="8" step="1" value="0"></div><label class="check"><input id="gray" type="checkbox"> Grayscale</label>`; commonAction('Apply & Download',processImage); ['bright','contrast','sat','blur'].forEach(id=>document.getElementById(id).oninput=previewEditor);
  }
  if(mode==='rotate'){
    c.innerHTML=`<div class="ratio-grid"><button class="ratio" data-rotate="-90">↺ 90°</button><button class="ratio active" data-rotate="0">0°</button><button class="ratio" data-rotate="90">↻ 90°</button><button class="ratio" data-rotate="180">180°</button></div><div class="ratio-grid"><button class="ratio" data-flip="h">Flip H</button><button class="ratio" data-flip="v">Flip V</button></div>`; commonAction('Apply & Download',processImage); document.querySelectorAll('[data-rotate]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-rotate]').forEach(x=>x.classList.remove('active'));b.classList.add('active')}); document.querySelectorAll('[data-flip]').forEach(b=>b.onclick=()=>{b.classList.toggle('active')});
  }
  if(mode==='watermark'){
    c.innerHTML=`<label class="control-group">Watermark text<input id="wmText" type="text" placeholder="© Pixel Refine"></label><div class="control-row"><label>Size (px)<input id="wmSize" type="number" min="8" value="36"></label><label>Opacity <input id="wmOpacity" type="range" min="10" max="100" value="65"></label></div><label class="control-group">Position<select id="wmPos"><option value="br">Bottom right</option><option value="bl">Bottom left</option><option value="tr">Top right</option><option value="tl">Top left</option><option value="c">Center</option></select></label>`; commonAction('Add Watermark & Download',processImage);
  }
  if(mode==='eraser'){
    c.innerHTML=`<div class="control-row"><label>Brush size <output id="eraseSizeV">40px</output></label><input id="eraseSize" type="range" min="5" max="180" value="40"></div><div class="eraser-board"><canvas id="eraseCanvas"></canvas><div class="eraser-help">Paint over the unwanted area. Erased pixels become transparent.</div></div><div class="control-row"><button class="secondary" id="eraseUndo">Undo</button><button class="secondary" id="eraseReset">Reset</button></div><button class="action" id="eraseDownload" disabled>Erase & Download PNG</button>`;
    document.getElementById('eraseSize').oninput=e=>document.getElementById('eraseSizeV').textContent=e.target.value+'px';
    document.getElementById('eraseDownload').onclick=downloadEraser;
  }
  if(mode==='expand'){
    c.innerHTML=`<div class="control-row"><label>Extra width (px)<input id="expandW" type="number" min="0" value="200"></label><label>Extra height (px)<input id="expandH" type="number" min="0" value="200"></label></div><label class="control-group">Background<select id="expandBg"><option value="#ffffff">White</option><option value="#000000">Black</option><option value="transparent">Transparent</option></select></label>`; commonAction('Expand & Download',processImage);
  }
  if(mode==='advanced' && type==='image'){
    c.innerHTML=`<div class="info-panel"><b>AI/API feature</b><span>Your upload is ready. A secure AI endpoint is required for the actual AI operation.</span></div><button class="action" id="advancedAction">Process Image</button>`; document.getElementById('advancedAction').onclick=()=>showStatus('File ready. Connect the secure AI processing endpoint to complete this tool.',false);
  }
}

function enhanceRatios(){
  const resize=document.querySelector('#toolControls .ratio-grid');
  if(currentTool&&currentTool[4]==='resize'&&resize&&!resize.dataset.enhanced){
    const labels=[['2:3','2:3'],['3:2','3:2'],['5:4','5:4'],['3:4','3:4'],['4:3','4:3'],['9:16','9:16']];
    labels.forEach(([v,l])=>{const b=document.createElement('button');b.className='ratio';b.dataset.r=v;b.textContent=l;resize.appendChild(b)});
    resize.dataset.enhanced='1';setupResizeLogic();
  }
  const crop=document.querySelector('#toolControls .ratio-grid');
  if(currentTool&&currentTool[4]==='crop'&&crop&&!crop.dataset.enhanced){
    const labels=[['2:3','2:3'],['3:2','3:2'],['5:4','5:4'],['4:3','4:3']];
    labels.forEach(([v,l])=>{const b=document.createElement('button');b.className='ratio';b.dataset.crop=v;b.textContent=l;crop.appendChild(b)});
    crop.dataset.enhanced='1';setupCropLogic();
  }
}

function handleFile(file){
  if(!file)return;
  currentFile=file;
  const info=document.getElementById('fileInfo'), status=document.getElementById('status'), preview=document.getElementById('previewBox');
  info.textContent=`✓ ${file.name} • ${formatBytes(file.size)}`; preview.innerHTML=''; document.querySelectorAll('#toolControls .action').forEach(btn=>btn.disabled=false); status.innerHTML='<span class="success-dot"></span> File uploaded — actions are ready below.';
  if(file.type.startsWith('image/')){
    const url=URL.createObjectURL(file), img=document.createElement('img'); img.src=url; img.alt='Selected image preview'; img.onload=()=>{URL.revokeObjectURL(url); imageState={width:img.naturalWidth,height:img.naturalHeight}; updateDimensions(); if(currentTool[4]==='crop')initCrop(img.naturalWidth,img.naturalHeight); if(currentTool[4]==='eraser')initEraserCanvas(img);}; preview.appendChild(img);
  }else preview.innerHTML=`<div class="doc-preview">📄<span>${file.type||'Document'}</span></div>`;
}

function setupResizeLogic(){
  document.querySelectorAll('[data-r]').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('[data-r]').forEach(x=>x.classList.remove('active'));b.classList.add('active');
    const r=b.dataset.r;if(!imageState)return;
    if(r==='original'){resizeW.value=imageState.width;resizeH.value=imageState.height;return}
    const [rw,rh]=r.split(':').map(Number); let w=imageState.width,h=Math.round(w*rh/rw); if(h>imageState.height){h=imageState.height;w=Math.round(h*rw/rh)} resizeW.value=w;resizeH.value=h; updateLiveSize(w,h);
  });
  ['resizeW','resizeH'].forEach(id=>document.getElementById(id).addEventListener('input',()=>{const lock=document.getElementById('lockRatio').checked;if(!lock||!imageState)return; if(id==='resizeW'){const w=+resizeW.value||0;resizeH.value=Math.round(w*imageState.height/imageState.width)}else{const h=+resizeH.value||0;resizeW.value=Math.round(h*imageState.width/imageState.height)} updateLiveSize(+resizeW.value,+resizeH.value)}));
}
function updateDimensions(){if(!imageState)return; const w=document.getElementById('resizeW');const h=document.getElementById('resizeH');if(w){w.value=imageState.width;h.value=imageState.height;updateLiveSize(imageState.width,imageState.height)} if(currentTool&&currentTool[4]==='crop')initCrop(imageState.width,imageState.height)}
function updateLiveSize(w,h){const el=document.getElementById('liveSize');if(el)el.textContent=`Output: ${Math.max(1,Math.round(w))} × ${Math.max(1,Math.round(h))} px`}

function setupCropLogic(){document.querySelectorAll('[data-crop]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-crop]').forEach(x=>x.classList.remove('active'));b.classList.add('active');applyCropRatio(b.dataset.crop)})}
function initCrop(w,h){const cw=Math.min(w,1200), ch=Math.min(h,1200);document.getElementById('cropW').value=cw;document.getElementById('cropH').value=ch;document.getElementById('cropX').value=0;document.getElementById('cropY').value=0;updateCropInfo()}
function applyCropRatio(r){if(!imageState||r==='free')return updateCropInfo();const [rw,rh]=r.split(':').map(Number);let w=imageState.width,h=Math.round(w*rh/rw);if(h>imageState.height){h=imageState.height;w=Math.round(h*rw/rh)}document.getElementById('cropW').value=w;document.getElementById('cropH').value=h;document.getElementById('cropX').value=Math.floor((imageState.width-w)/2);document.getElementById('cropY').value=Math.floor((imageState.height-h)/2);updateCropInfo()}
['cropX','cropY','cropW','cropH'].forEach(id=>document.addEventListener('input',e=>{if(e.target.id===id)updateCropInfo()}));
function updateCropInfo(){const ids=['cropX','cropY','cropW','cropH'];if(!ids.every(id=>document.getElementById(id)))return;let x=+cropX.value||0,y=+cropY.value||0,w=+cropW.value||0,h=+cropH.value||0;if(imageState){x=Math.max(0,Math.min(x,imageState.width-1));y=Math.max(0,Math.min(y,imageState.height-1));w=Math.min(w,imageState.width-x);h=Math.min(h,imageState.height-y)}const el=document.getElementById('cropInfo');if(el)el.textContent=`Crop area: ${w} × ${h} px • Position: ${x}, ${y}`}

function previewEditor(){const ids=['bright','contrast','sat','blur'];if(!ids.every(id=>document.getElementById(id)))return;brightV.textContent=bright.value;contrastV.textContent=contrast.value;satV.textContent=sat.value;blurV.textContent=blur.value+'px'}

let eraserHistory=[];
function initEraserCanvas(img){const canvas=document.getElementById('eraseCanvas');if(!canvas)return;const maxW=Math.min(760,document.getElementById('dropZone')?.clientWidth||760);const scale=Math.min(1,maxW/img.naturalWidth);canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);eraserHistory=[ctx.getImageData(0,0,canvas.width,canvas.height)];let drawing=false;const paint=e=>{if(!drawing)return;const r=canvas.getBoundingClientRect();const x=(e.clientX-r.left)*canvas.width/r.width,y=(e.clientY-r.top)*canvas.height/r.height,brush=(+document.getElementById('eraseSize')?.value||40)*canvas.width/img.naturalWidth;ctx.save();ctx.globalCompositeOperation='destination-out';ctx.beginPath();ctx.arc(x,y,brush/2,0,Math.PI*2);ctx.fill();ctx.restore()};canvas.onpointerdown=e=>{drawing=true;canvas.setPointerCapture(e.pointerId);eraserHistory.push(ctx.getImageData(0,0,canvas.width,canvas.height));paint(e)};canvas.onpointermove=paint;canvas.onpointerup=()=>drawing=false;canvas.onpointercancel=()=>draw
