/* Pixel Refine — polished client-side tools.
   Note: localStorage account/coin features are a demo. Production needs a secure backend.
*/
const PR = {
  safeText(value = '') {
    return String(value).replace(/[&<>"']/g, ch => ({
      '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
    }[ch]));
  },
  localDay() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
};

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

const grid = document.getElementById('toolGrid');
const search = document.getElementById('search');
const count = document.getElementById('count');

let filter = 'all', currentFile = null, currentTool = null, imageState = null;

function render() {
  const q = (search.value || '').toLowerCase().trim();
  const list = tools.filter(t =>
    (filter === 'all' || t[3] === filter) &&
    (`${t[0]} ${t[1]}`).toLowerCase().includes(q)
  );

  count.textContent = `${list.length} tools`;

  grid.innerHTML = list.map(t => {
    const i = tools.indexOf(t);
    return `<article class="tool" data-index="${i}" tabindex="0" role="button" aria-label="Open ${PR.safeText(t[0])}">
      <div class="icon">${t[2]}</div>
      <h3>${PR.safeText(t[0])}</h3>
      <p>${PR.safeText(t[1])}</p>
      <div class="tag">${PR.safeText(t[3])}</div>
    </article>`;
  }).join('');

  grid.querySelectorAll('.tool').forEach(card => {
    card.addEventListener('click', () => openTool(+card.dataset.index));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openTool(+card.dataset.index);
      }
    });
  });
}

document.querySelectorAll('.chips button').forEach(b => b.addEventListener('click', () => {
  document.querySelectorAll('.chips button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  filter = b.dataset.filter;
  render();
}));

search.addEventListener('input', render);

const modal = document.getElementById('modal');
const content = document.getElementById('modalContent');

document.getElementById('close').onclick = closeModal;
modal.addEventListener('click', e => {
  if (e.target === modal) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

function closeModal() {
  modal.classList.remove('show');
  currentFile = null;
  imageState = null;
}

function openTool(index) {
  const t = tools[index];
  currentTool = t;
  currentFile = null;
  imageState = null;

  if (t[4] === 'password') return passwordTool();
  if (t[4] === 'qr') return qrTool();
  if (t[4] === 'barcode') return barcodeTool();
  if (t[4] === 'utility') return utilityTool();

  const accept = t[0] === 'Image to PDF' ? 'image/*' : (t[3] === 'pdf' ? '.pdf,.doc,.docx' : 'image/*');

  content.innerHTML = `
    <div class="tool-modal-head">
      <div class="icon">${t[2]}</div>
      <div>
        <h2>${t[0]}</h2>
        <p>${t[1]}</p>
      </div>
    </div>

    <!-- Results and editing controls stay directly under the tool title, not at the bottom. -->
    <div id="resultArea"></div>

    <div class="drop" id="dropZone">
      <div class="upload-icon">☁️</div>
      <b>Upload your ${t[3] === 'pdf' ? 'document' : 'image'}</b>
      <br><span class="upload-hint">Tap to browse or drag & drop</span>
      <input type="file" id="fileInput" accept="${accept}" aria-label="Choose file">
      <div class="upload-actions" id="uploadActions">
        <button class="primary" id="chooseFile" type="button">Choose File</button>
      </div>
      <div id="previewArea" hidden>
        <img id="preview" alt="Image preview">
        <p id="fileInfo"></p>
        <button class="primary" id="changeFile" type="button">Change File</button>
      </div>
    </div>

    <div id="optionsArea"></div>
    <div class="live-progress" id="liveProgress" aria-live="polite">
      <div class="live-progress-top"><strong>Live processing demo</strong><span id="livePercent">Ready</span></div>
      <div class="live-track"><div id="liveBar"></div></div>
      <ol id="liveSteps"><li class="step-active">Waiting for a file</li><li>Preparing image</li><li>Processing</li><li>Preparing download</li></ol>
      <p class="live-caption" id="liveCaption">Upload a file to watch each stage here.</p>
    </div>
    <div id="status" role="status" aria-live="polite"></div>

    <div class="modal-actions">
      <button class="secondary" id="cancelBtn" type="button">Cancel</button>
      <button class="primary" id="processBtn" type="button" disabled>Process Image</button>
    </div>
  `;

  modal.classList.add('show');

  const input = document.getElementById('fileInput');
  const drop = document.getElementById('dropZone');
  const choose = document.getElementById('chooseFile');
  const changeFile = document.getElementById('changeFile');
  const process = document.getElementById('processBtn');

  choose.onclick = () => input.click();
  if (changeFile) changeFile.onclick = e => { e.stopPropagation(); input.click(); };
  if (t[4] === 'enhance') document.getElementById('optionsArea').addEventListener('input', updateEnhancerLivePreview);
  drop.onclick = e => {
    if (e.target !== input && e.target !== choose) input.click();
  };

  input.onchange = () => {
    if (input.files && input.files[0]) loadFile(input.files[0]);
  };

  drop.ondragover = e => {
    e.preventDefault();
    drop.classList.add('dragging');
  };

  drop.ondragleave = () => drop.classList.remove('dragging');

  drop.ondrop = e => {
    e.preventDefault();
    drop.classList.remove('dragging');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      loadFile(e.dataTransfer.files[0]);
    }
  };

  document.getElementById('cancelBtn').onclick = closeModal;
  process.onclick = processCurrentTool;

  if (t[4] === 'compress') {
    addOption('Target file size', 'targetSize', 'number', 48, 1, 50000);
    addOption('Size unit', 'targetUnit', 'select', 'KB', [
      ['KB', 'KB'],
      ['MB', 'MB']
    ]);
    addOption('Output format', 'compressFormat', 'select', 'image/jpeg', [
      ['image/jpeg', 'JPG'],
      ['image/webp', 'WebP']
    ]);
    addOption('Quality (used if target size cannot be reached)', 'quality', 'range', 80, 10, 100);
  } else if (t[4] === 'resize') {
    addOption('Width (px)', 'width', 'number', 800, 1, 12000);
    addOption('Height (px)', 'height', 'number', 800, 1, 12000);
    addOption('Lock aspect ratio', 'aspect', 'checkbox', true);
  } else if (t[4] === 'convert') {
    addOption('Output format', 'format', 'select', 'image/png', [
      ['image/png', 'PNG'],
      ['image/jpeg', 'JPG / JPEG'],
      ['image/webp', 'WebP'],
      ['image/avif', 'AVIF (if supported by browser)']
    ]);
  } else if (t[4] === 'upscale') {
    addOption('Scale factor', 'scale', 'select', '2', [
      ['2', '2×'],
      ['4', '4×'],
      ['8', '8×'],
      ['16', '16×']
    ]);
  } else if (t[4] === 'enhance') {
    const live = document.createElement('div');
    live.className = 'enhancer-live-preview';
    live.innerHTML = '<strong>Live preview</strong><canvas id="enhancerPreview"></canvas><small>Move sliders to preview changes instantly.</small>';
    document.getElementById('optionsArea').appendChild(live);
    addOption('Brightness', 'brightness', 'range', 100, 0, 200);
    addOption('Contrast', 'contrast', 'range', 100, 0, 200);
    addOption('Highlights', 'highlights', 'range', 0, -100, 100);
    addOption('Shadows', 'shadows', 'range', 0, -100, 100);
    addOption('Saturation', 'saturation', 'range', 100, 0, 200);
    addOption('Vibrance', 'vibrance', 'range', 0, -100, 100);
    addOption('Colour temperature', 'temperature', 'range', 0, -100, 100);
    addOption('Hue', 'hue', 'range', 0, -180, 180);
    addOption('Sharpen', 'sharpen', 'range', 0, 0, 100);
    addOption('Fade', 'fade', 'range', 0, 0, 100);
    addOption('Vignette', 'vignette', 'range', 0, 0, 100);
    addOption('Dehaze', 'dehaze', 'range', 0, 0, 100);
  } else if (t[4] === 'expand') {
    addOption('Extra canvas (%)', 'expand', 'range', 20, 0, 100);
    addOption('Background', 'background', 'select', '#ffffff', [
      ['#ffffff', 'White'],
      ['#000000', 'Black'],
      ['transparent', 'Transparent']
    ]);
  } else if (t[4] === 'rotate') {
    addOption('Rotation', 'rotation', 'select', '90', [
      ['90', '90°'],
      ['180', '180°'],
      ['270', '270°']
    ]);
    addOption('Flip horizontally', 'flipH', 'checkbox', false);
    addOption('Flip vertically', 'flipV', 'checkbox', false);
  } else if (t[4] === 'watermark') {
    addOption('Watermark text', 'watermark', 'text', 'Pixel Refine');
    addOption('Text size', 'watermarkSize', 'number', 36, 8, 200);
    addOption('Opacity (%)', 'watermarkOpacity', 'range', 40, 5, 100);
  } else if (t[4] === 'crop') {
    addOption('Crop shape', 'cropShape', 'select', 'rectangle', [
      ['rectangle', 'Rectangle'],
      ['square', 'Square'],
      ['circle', 'Circle (transparent outside)']
    ]);
    addOption('Crop ratio', 'cropRatio', 'select', 'free', [
      ['free', 'Free / Original proportions'],
      ['1:1', 'Square 1:1'],
      ['5:4', 'Landscape 5:4'],
      ['4:5', 'Portrait 4:5'],
      ['3:2', 'Landscape 3:2'],
      ['2:3', 'Portrait 2:3'],
      ['4:3', 'Landscape 4:3'],
      ['3:4', 'Portrait 3:4'],
      ['5:3', 'Landscape 5:3'],
      ['3:5', 'Portrait 3:5'],
      ['16:9', 'Widescreen 16:9'],
      ['9:16', 'Story / Reel 9:16'],
      ['21:9', 'Ultrawide 21:9'],
      ['2:1', 'Panorama 2:1'],
      ['1:2', 'Tall 1:2'],
      ['7:5', 'Photo 7:5'],
      ['5:7', 'Portrait 5:7']
    ]);
    addOption('Output pixel preset', 'cropPixels', 'select', 'original', [
      ['original', 'Use cropped image pixels'],
      ['320x320', '320 × 320 px'],
      ['640x480', '640 × 480 px'],
      ['800x600', '800 × 600 px'],
      ['1024x1024', '1024 × 1024 px'],
      ['1080x1080', '1080 × 1080 px'],
      ['1080x1350', '1080 × 1350 px'],
      ['1080x1920', '1080 × 1920 px'],
      ['1280x720', '1280 × 720 px'],
      ['1920x1080', '1920 × 1080 px'],
      ['custom', 'Custom width and height']
    ]);
    addOption('Custom width (px)', 'cropCustomWidth', 'number', 1080, 1, 12000);
    addOption('Custom height (px)', 'cropCustomHeight', 'number', 1080, 1, 12000);
    const preset = document.getElementById('cropPixels');
    const customWidth = document.getElementById('cropCustomWidth');
    const customHeight = document.getElementById('cropCustomHeight');
    const updateCustomSizeVisibility = () => {
      const custom = preset && preset.value === 'custom';
      if (customWidth) customWidth.closest('.option').hidden = !custom;
      if (customHeight) customHeight.closest('.option').hidden = !custom;
    };
    if (preset) {
      preset.addEventListener('change', updateCustomSizeVisibility);
      updateCustomSizeVisibility();
    }
  }
}


function enhancerFilterString() {
  const brightness = Number(getOption('brightness', 100));
  const contrast = Number(getOption('contrast', 100)) + Number(getOption('dehaze', 0)) * 0.25;
  const saturation = Math.max(0, Number(getOption('saturation', 100)) + Number(getOption('vibrance', 0)) * 0.55);
  const hue = Number(getOption('hue', 0));
  return `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) hue-rotate(${hue}deg)`;
}
function renderEnhancedCanvas(image) {
  const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
  const ctx = canvas.getContext('2d');
  ctx.filter = enhancerFilterString();
  ctx.drawImage(image, 0, 0);
  ctx.filter = 'none';
  const warm = Number(getOption('temperature', 0));
  if (warm !== 0) {
    ctx.globalAlpha = Math.abs(warm) / 500;
    ctx.fillStyle = warm > 0 ? '#ff9b45' : '#4b9dff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  const fade = Number(getOption('fade', 0));
  if (fade > 0) {
    ctx.globalAlpha = fade / 250;
    ctx.fillStyle = '#eee5d5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
  }
  const vignette = Number(getOption('vignette', 0));
  if (vignette > 0) {
    const g = ctx.createRadialGradient(canvas.width/2, canvas.height/2, Math.min(canvas.width,canvas.height)*0.2, canvas.width/2, canvas.height/2, Math.max(canvas.width,canvas.height)*0.72);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${vignette/140})`);
    ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
  }
  const highlights = Number(getOption('highlights', 0));
  const shadows = Number(getOption('shadows', 0));
  if (highlights || shadows) {
    const frame = ctx.getImageData(0,0,canvas.width,canvas.height);
    const d = frame.data;
    for (let i=0;i<d.length;i+=4) {
      const lum=(d[i]+d[i+1]+d[i+2])/3;
      if (highlights && lum>150) { const f=highlights/100*(lum-150)/105; for(let c=0;c<3;c++) d[i+c]=Math.max(0,Math.min(255,d[i+c]*(1-f))); }
      if (shadows && lum<120) { const f=shadows/100*(120-lum)/120*0.8; for(let c=0;c<3;c++) d[i+c]=Math.max(0,Math.min(255,d[i+c]+(f>0?(255-d[i+c])*f:d[i+c]*f))); }
    }
    ctx.putImageData(frame,0,0);
  }
  const sharp = Number(getOption('sharpen', 0));
  if (sharp > 0) {
    const src=ctx.getImageData(0,0,canvas.width,canvas.height), out=ctx.createImageData(canvas.width,canvas.height), a=src.data,b=out.data, amount=sharp/100;
    for(let y=1;y<canvas.height-1;y++) for(let x=1;x<canvas.width-1;x++) {
      const i=(y*canvas.width+x)*4;
      for(let c=0;c<3;c++) b[i+c]=Math.max(0,Math.min(255,a[i+c]+amount*(4*a[i+c]-a[i-4+c]-a[i+4+c]-a[i-4*canvas.width+c]-a[i+4*canvas.width+c])));
      b[i+3]=a[i+3];
    }
    ctx.putImageData(out,0,0);
  }
  return canvas;
}
function updateEnhancerLivePreview() {
  const img = document.getElementById('preview');
  const canvas = document.getElementById('enhancerPreview');
  if (!img || !canvas || !img.complete || !img.naturalWidth) return;
  const maxSide = 900, scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.filter = enhancerFilterString();
  ctx.drawImage(img,0,0,canvas.width,canvas.height);
  ctx.filter = 'none';
  const warm=Number(getOption('temperature',0));
  if(warm){ctx.globalAlpha=Math.abs(warm)/500;ctx.fillStyle=warm>0?'#ff9b45':'#4b9dff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;}
  const fade=Number(getOption('fade',0)); if(fade){ctx.globalAlpha=fade/250;ctx.fillStyle='#eee5d5';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.globalAlpha=1;}
  const vignette=Number(getOption('vignette',0)); if(vignette){const g=ctx.createRadialGradient(canvas.width/2,canvas.height/2,Math.min(canvas.width,canvas.height)*.2,canvas.width/2,canvas.height/2,Math.max(canvas.width,canvas.height)*.72);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,`rgba(0,0,0,${vignette/140})`);ctx.fillStyle=g;ctx.fillRect(0,0,canvas.width,canvas.height);}
}

function addOption(label, id, type, value, min, max) {
  const area = document.getElementById('optionsArea');
  if (!area) return;

  const wrapper = document.createElement('label');
  wrapper.className = 'option';
  wrapper.appendChild(document.createTextNode(label));

  let el;

  if (type === 'select') {
    el = document.createElement('select');
    min.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item[0];
      opt.textContent = item[1];
      el.appendChild(opt);
    });
    el.value = value;
  } else if (type === 'checkbox') {
    el = document.createElement('input');
    el.type = 'checkbox';
    el.checked = Boolean(value);
  } else {
    el = document.createElement('input');
    el.type = type;
    if (value !== undefined) el.value = value;
    if (min !== undefined) el.min = min;
    if (max !== undefined) el.max = max;
  }

  el.id = id;
  wrapper.appendChild(el);
  area.appendChild(wrapper);
}

function getOption(id, fallback = '') {
  const el = document.getElementById(id);
  if (!el) return fallback;
  if (el.type === 'checkbox') return el.checked;
  return el.value;
}

function setStatus(message, error = false) {
  const el = document.getElementById('status');
  if (el) {
    el.textContent = message;
    el.style.color = error ? '#dc2626' : '';
  }
  const caption = document.getElementById('liveCaption');
  if (caption && message) caption.textContent = message;
}
function setLiveProgress(percent, label, stepIndex = 0) {
  const bar = document.getElementById('liveBar');
  const value = document.getElementById('livePercent');
  const steps = document.querySelectorAll('#liveSteps li');
  if (bar) bar.style.width = Math.max(0, Math.min(100, percent)) + '%';
  if (value) value.textContent = label || (Math.round(percent) + '%');
  steps.forEach((step, index) => {
    step.classList.toggle('step-done', index < stepIndex);
    step.classList.toggle('step-active', index === stepIndex);
  });
}


function mountManualEditor(sourceUrl, compareUrl = null, label = 'Manual erase editor') {
  const area = document.getElementById('resultArea');
  if (!area) return;
  area.innerHTML = `
    <section class="manual-editor">
      <div class="manual-editor-head"><h3>${label}</h3><p>Brush se erase karo; Restore se galti wapas lao. Changes download karne se pehle live dikhte hain.</p></div>
      <div class="manual-toolbar">
        <button type="button" class="secondary" id="brushErase">🖌️ Erase</button>
        <button type="button" class="secondary" id="brushRestore">🩹 Restore</button>
        <label>Brush <input id="brushSize" type="range" min="5" max="140" value="32"><span id="brushSizeValue">32 px</span></label>
        <button type="button" class="secondary" id="brushUndo">↶ Undo</button>
        <button type="button" class="secondary" id="brushReset">Reset</button>
        <button type="button" class="primary" id="brushDownload">Download PNG</button>
      </div>
      <div class="compare-grid">
        <div class="compare-panel"><b>${compareUrl ? 'Before' : 'Original / live edit'}</b><img id="manualBefore" alt="Before editing"></div>
        <div class="compare-panel"><b>${compareUrl ? 'After / manual edit' : 'After / transparent areas'}</b><div class="editor-canvas-wrap"><canvas id="manualCanvas" aria-label="Manual eraser canvas"></canvas></div></div>
      </div>
      <p class="manual-hint">Tip: phone par ungli se canvas par draw karein. Transparent hissa checkerboard par dikh sakta hai.</p>
    </section>`;
  const canvas = document.getElementById('manualCanvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const before = document.getElementById('manualBefore');
  before.src = compareUrl || sourceUrl;
  const image = new Image();
  image.onload = () => {
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    ctx.drawImage(image, 0, 0);
    let mode = 'erase', drawing = false, history = [];
    const remember = () => {
      try { history.push(ctx.getImageData(0, 0, canvas.width, canvas.height)); if (history.length > 20) history.shift(); } catch (_) {}
    };
    remember();
    const eraseBtn = document.getElementById('brushErase');
    const restoreBtn = document.getElementById('brushRestore');
    const brush = document.getElementById('brushSize');
    const setMode = next => {
      mode = next;
      eraseBtn.classList.toggle('active', mode === 'erase');
      restoreBtn.classList.toggle('active', mode === 'restore');
    };
    eraseBtn.onclick = () => setMode('erase');
    restoreBtn.onclick = () => setMode('restore');
    brush.oninput = () => document.getElementById('brushSizeValue').textContent = brush.value + ' px';
    const point = event => {
      const rect = canvas.getBoundingClientRect();
      return {x:(event.clientX-rect.left)*canvas.width/rect.width,y:(event.clientY-rect.top)*canvas.height/rect.height};
    };
    const paint = event => {
      const p = point(event), radius = Number(brush.value) / 2;
      ctx.save();
      if (mode === 'erase') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath(); ctx.arc(p.x,p.y,radius,0,Math.PI*2); ctx.fill();
      } else {
        ctx.beginPath(); ctx.arc(p.x,p.y,radius,0,Math.PI*2); ctx.clip();
        ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(image,0,0,canvas.width,canvas.height);
      }
      ctx.restore();
    };
    canvas.onpointerdown = event => { drawing=true; remember(); canvas.setPointerCapture?.(event.pointerId); paint(event); };
    canvas.onpointermove = event => { if (drawing) paint(event); };
    const stop = () => { if (drawing) { drawing=false; remember(); } };
    canvas.onpointerup = stop; canvas.onpointercancel = stop;
    document.getElementById('brushUndo').onclick = () => {
      if (history.length > 1) { history.pop(); ctx.putImageData(history[history.length-1],0,0); }
    };
    document.getElementById('brushReset').onclick = () => { ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(image,0,0); history=[ctx.getImageData(0,0,canvas.width,canvas.height)]; };
    document.getElementById('brushDownload').onclick = () => canvas.toBlob(blob => {
      if (!blob) { setStatus('Could not export the edited image.', true); return; }
      downloadBlob(blob, (currentFile?.name || 'pixel-refine-image').replace(/\.[^.]+$/,'') + '-edited.png');
      setStatus('Manual edit downloaded as a transparent PNG.');
    }, 'image/png');
    setMode('erase');
  };
  image.onerror = () => setStatus('Could not open image for manual editing.', true);
  image.src = sourceUrl;
}

function loadFile(file) {
  if (!currentTool) return;
  const isImageTool = currentTool[3] === 'image' || currentTool[0] === 'Image to PDF';
  const isPdfTool = currentTool[3] === 'pdf' && currentTool[0] !== 'Image to PDF';
  if (file.size > 50 * 1024 * 1024) { setStatus('File is too large. Maximum allowed size is 50 MB.', true); return; }
  if (isImageTool && !file.type.startsWith('image/')) { setStatus('Please choose a valid image file.', true); return; }
  if (isPdfTool && !(/\.pdf$/i.test(file.name) || file.type === 'application/pdf')) { setStatus('Please choose a PDF file for this tool.', true); return; }
  currentFile = file;
  if (isPdfTool) {
    imageState = null;
    document.getElementById('previewArea').hidden = true;
    document.getElementById('dropZone').classList.remove('has-preview');
    document.getElementById('uploadActions').hidden = false;
    document.getElementById('processBtn').disabled = false;
    document.getElementById('processBtn').textContent = 'Process PDF';
    setLiveProgress(0, 'Ready', 0);
    setStatus(`PDF ready: ${file.name} • ${(file.size / 1024).toFixed(1)} KB. Press Process PDF.`);
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const img = document.getElementById('preview');
    img.src = reader.result;
    document.getElementById('previewArea').hidden = false;
    document.getElementById('dropZone').classList.add('has-preview');
    document.getElementById('uploadActions').hidden = true;
    document.getElementById('fileInfo').textContent = `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;
    img.onload = () => {
      if (img.naturalWidth > 12000 || img.naturalHeight > 12000) { currentFile = null; document.getElementById('processBtn').disabled = true; setStatus('Image dimensions must not exceed 12,000 × 12,000 pixels.', true); return; }
      imageState = {src:img.src,width:img.naturalWidth,height:img.naturalHeight};
      document.getElementById('processBtn').disabled = false;
      document.getElementById('processBtn').textContent = 'Process Image';
      setLiveProgress(0, 'Ready', 0);
      setStatus('Image ready to process. Live stages will update while the tool runs.');
      if (currentTool && currentTool[4] === 'enhance') updateEnhancerLivePreview();
      if (currentTool && currentTool[0] === 'Magic Eraser') { setStatus('Manual Magic Eraser is ready below: use Erase/Restore, then Download PNG.'); mountManualEditor(imageState.src, null, 'Magic Eraser — manual brush editor'); }
    };
  };
  reader.onerror = () => setStatus('Could not read this file. Please try another one.', true);
  reader.readAsDataURL(file);
}

async function processPdfTool() {
  const button=document.getElementById('processBtn'); button.disabled=true; button.textContent='Processing PDF…';
  setLiveProgress(8,'Loading PDF engine',0); setStatus('Preparing PDF processing in your browser…');
  try {
    const mod=await import('https://esm.sh/pdf-lib@1.17.1?bundle');
    const PDFDocument=mod.PDFDocument, {StandardFonts,rgb}=mod;
    if(!PDFDocument) throw new Error('PDF library did not load. Check internet and retry.');
    const bytes=await currentFile.arrayBuffer(), name=currentFile.name.replace(/\.pdf$/i,'')||'document';
    const source=await PDFDocument.load(bytes); const tool=currentTool[0]; setLiveProgress(35,'Reading PDF',1);
    if(tool==='PDF Merger') throw new Error('Merger requires selecting multiple PDF files; the current upload control accepts only one file. Other single-PDF tools are being enabled.');
    if(tool==='Word to PDF') throw new Error('DOCX-to-PDF needs a document layout renderer that is not currently included.');
    if(tool==='PDF Protect') throw new Error('Password encryption is not supported by the current PDF library. This tool needs a dedicated encryption library/backend; the file will not be falsely labelled protected.');
    if(tool==='PDF to Word') {
      const pdfjs=await import('https://esm.sh/pdfjs-dist@4.4.168/legacy/build/pdf.mjs');
      const pdf=await pdfjs.getDocument({data:new Uint8Array(bytes)}).promise; let txt='';
      for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p);const c=await page.getTextContent();txt+=c.items.map(x=>x.str||'').join(' ')+'\n\n';}
      downloadBlob(new Blob([txt],{type:'text/plain;charset=utf-8'}),name+'.txt');
      setStatus('PDF text extracted and downloaded as TXT. Page layout and images are not preserved in this basic export.');
    } else if(tool==='PDF to JPG') {
      const pdfjs=await import('https://esm.sh/pdfjs-dist@4.4.168/legacy/build/pdf.mjs');
      const pdf=await pdfjs.getDocument({data:new Uint8Array(bytes)}).promise;
      for(let p=1;p<=pdf.numPages;p++){setLiveProgress(35+p/pdf.numPages*50,'Rendering page '+p,2);const page=await pdf.getPage(p);const vp=page.getViewport({scale:1.5});const c=document.createElement('canvas');c.width=Math.ceil(vp.width);c.height=Math.ceil(vp.height);await page.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;const blob=await new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('JPG export failed')),'image/jpeg',.92));downloadBlob(blob,name+'-page-'+p+'.jpg');}
      setStatus('Rendered '+pdf.numPages+' page(s) to JPG. Allow multiple downloads if prompted.');
    } else if(tool==='PDF Splitter'||tool==='PDF Page Extractor') {
      const total=source.getPageCount();const raw=prompt('Enter pages/ranges (example: 1,3,5-7). For PDF Splitter, leave blank to save each page separately.');
      if(raw===null)return;let ids=[];
      if(!raw.trim()&&tool==='PDF Splitter')ids=Array.from({length:total},(_,i)=>i);
      else for(const part of raw.split(',').map(x=>x.trim()).filter(Boolean)){const m=part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw new Error('Invalid page range. Example: 1,3,5-7');const a=+m[1],b=+(m[2]||m[1]);if(a<1||b<a||b>total)throw new Error('Pages must be between 1 and '+total);for(let p=a;p<=b;p++)if(!ids.includes(p-1))ids.push(p-1);}
      if(!ids.length)throw new Error('No pages selected.');
      if(tool==='PDF Splitter'&&!raw.trim()){for(const id of ids){const out=await PDFDocument.create();const [pg]=await out.copyPages(source,[id]);out.addPage(pg);downloadBlob(new Blob([await out.save()],{type:'application/pdf'}),name+'-page-'+(id+1)+'.pdf');}setStatus('Split into '+ids.length+' PDF files. Allow multiple downloads if asked.');}
      else{const out=await PDFDocument.create();(await out.copyPages(source,ids)).forEach(pg=>out.addPage(pg));downloadBlob(new Blob([await out.save()],{type:'application/pdf'}),name+'-pages.pdf');setStatus('Selected pages exported as a new PDF.');}
    } else if(tool==='PDF Page Numbering') {
      const font=await source.embedFont(StandardFonts.Helvetica);source.getPages().forEach((pg,i)=>{const {width}=pg.getSize();pg.drawText(String(i+1),{x:width-42,y:18,size:10,font,color:rgb(.25,.25,.25)});});
      downloadBlob(new Blob([await source.save()],{type:'application/pdf'}),name+'-numbered.pdf');setStatus('Page numbers added; PDF downloaded.');
    } else if(tool==='PDF Compressor') {
      // Real compression: render each page to a canvas, encode it as JPEG at
      // a chosen quality, then rebuild the PDF with the compressed page images.
      // This is much more effective for scanned/image-heavy PDFs than re-saving
      // the original PDF object structure.
      const qualityInput = prompt('Choose compression quality:\\n1 = Smallest file (lower quality)\\n2 = Balanced (recommended)\\n3 = Better quality (larger file)', '2');
      if (qualityInput === null) return;
      const qualityMap = {'1':0.38,'2':0.58,'3':0.76};
      const jpegQuality = qualityMap[qualityInput] || 0.58;
      setStatus('Loading PDF renderer… pages will be compressed as JPEG images.');
      const pdfjs = await import('https://esm.sh/pdfjs-dist@4.4.168/legacy/build/pdf.mjs');
      const pdf = await pdfjs.getDocument({data:new Uint8Array(bytes)}).promise;
      const compressed = await PDFDocument.create();
      for (let p=1; p<=pdf.numPages; p++) {
        setLiveProgress(15 + Math.round((p-1)/pdf.numPages*70), 'Compressing page '+p+' of '+pdf.numPages, 2);
        const page = await pdf.getPage(p);
        const originalViewport = page.getViewport({scale:1});
        const renderScale = Math.min(1.35, 1800 / Math.max(originalViewport.width, originalViewport.height));
        const viewport = page.getViewport({scale:Math.max(0.5,renderScale)});
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1,Math.ceil(viewport.width));
        canvas.height = Math.max(1,Math.ceil(viewport.height));
        const ctx = canvas.getContext('2d', {alpha:false});
        if (!ctx) throw new Error('Could not create a canvas to compress this PDF.');
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0,0,canvas.width,canvas.height);
        await page.render({canvasContext:ctx,viewport}).promise;
        const jpegBlob = await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Could not compress page '+p+'.')),'image/jpeg',jpegQuality));
        const jpgBytes = await jpegBlob.arrayBuffer();
        const embedded = await compressed.embedJpg(jpgBytes);
        const pageOut = compressed.addPage([originalViewport.width,originalViewport.height]);
        pageOut.drawImage(embedded,{x:0,y:0,width:originalViewport.width,height:originalViewport.height});
        canvas.width=0; canvas.height=0;
      }
      const compressedBytes = await compressed.save({useObjectStreams:true});
      const outBlob = new Blob([compressedBytes],{type:'application/pdf'});
      const beforeKB = (bytes.byteLength/1024).toFixed(1);
      const afterKB = (outBlob.size/1024).toFixed(1);
      const change = Math.round((1-outBlob.size/bytes.byteLength)*100);
      downloadBlob(outBlob,name+'-compressed.pdf');
      setStatus('Compression complete: '+beforeKB+' KB → '+afterKB+' KB ('+(change>=0?change+'% smaller':Math.abs(change)+'% larger')+'). Note: pages are converted to images, so selectable text/forms/links may not be preserved.');
    } else throw new Error('This PDF tool is not implemented yet.');
    setLiveProgress(100,'Complete',4);
  } catch(e) { console.error('PDF processing failed',e);setLiveProgress(0,'Failed',0);setStatus('PDF processing failed: '+(e.message||e),true); }
  finally {button.disabled=false;button.textContent='Process PDF';}
}

/* ==========================================
   PIXEL REFINE — PART 3
   Image processing and download functions
   ========================================== */

async function processCurrentTool() {
  if (!currentTool || !currentFile) { setStatus('Please upload a file first.', true); return; }
  if (currentTool[3] === 'pdf' && currentTool[0] !== 'Image to PDF') { await processPdfTool(); return; }
  if (!imageState) { setStatus('Please upload a valid image first.', true); return; }
  const action = currentTool[4];

  const button = document.getElementById('processBtn');

  // Real client-side Image to PDF using pdf-lib.
  if (currentTool[0] === 'Image to PDF') {
    button.disabled = true;
    button.textContent = 'Building PDF...';
    setLiveProgress(8, 'Starting', 0);
    setStatus('Loading PDF engine… your image stays in this browser.');
    try {
      const pdfModule = await import('https://esm.sh/pdf-lib@1.17.1?bundle');
      const PDFDocument = pdfModule.PDFDocument;
      if (!PDFDocument) throw new Error('PDF engine did not load.');
      setLiveProgress(35, 'Preparing image', 1);
      await new Promise(resolve => setTimeout(resolve, 120));
      const bytes = await currentFile.arrayBuffer();
      const pdfDoc = await PDFDocument.create();
      let embedded;
      if (/jpe?g$/i.test(currentFile.name) || currentFile.type === 'image/jpeg') {
        embedded = await pdfDoc.embedJpg(bytes);
      } else if (/\.png$/i.test(currentFile.name) || currentFile.type === 'image/png') {
        embedded = await pdfDoc.embedPng(bytes);
      } else {
        const sourceImage = await loadImage(imageState.src);
        const pngCanvas = createCanvas(sourceImage.naturalWidth, sourceImage.naturalHeight);
        pngCanvas.getContext('2d').drawImage(sourceImage, 0, 0);
        const pngBlob = await new Promise((resolve, reject) => pngCanvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not convert this image for PDF.')), 'image/png'));
        embedded = await pdfDoc.embedPng(await pngBlob.arrayBuffer());
      }
      const page = pdfDoc.addPage([embedded.width, embedded.height]);
      page.drawImage(embedded, { x: 0, y: 0, width: embedded.width, height: embedded.height });
      setLiveProgress(78, 'Creating PDF', 2);
      const pdfBytes = await pdfDoc.save();
      setLiveProgress(96, 'Preparing download', 3);
      downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), (currentFile.name.replace(/\.[^.]+$/, '') || 'image') + '.pdf');
      setLiveProgress(100, 'Complete', 4);
      setStatus('PDF created successfully. Download should start now.');
    } catch (error) {
      console.error('Image to PDF failed:', error);
      setStatus('Could not create PDF: ' + (error.message || error), true);
      setLiveProgress(0, 'Failed', 0);
    } finally {
      button.disabled = false;
      button.textContent = 'Process Image';
    }
    return;
  }

  // AI background removal: load the library and its model assets from IMG.LY's CDN.
  if (currentTool[0] === 'AI Background Remover') {
    button.disabled = true;
    button.textContent = 'Loading AI model...';
    setLiveProgress(5, 'Loading model', 0);
    setStatus('Connecting to the AI model. First use may download around 40 MB; keep the page open.');
    try {
      const module = await import('https://esm.sh/@imgly/background-removal@1.7.0?bundle&target=es2022');
      const removeBackground = module.default || module.removeBackground;
      if (typeof removeBackground !== 'function') {
        throw new Error('Background-removal function was not found in the loaded library.');
      }
      setLiveProgress(32, 'Preparing AI model', 1);
      const config = {
        publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
        model: 'isnet_quint8',
        debug: true,
        progress: (key, current, total) => {
          if (total > 0) {
            const percent = Math.round((current / total) * 100);
            setLiveProgress(Math.max(32, percent), 'Model ' + percent + '%', 1);
            setStatus('Downloading AI model: ' + percent + '% (' + key + '). Please keep the page open.');
          }
        }
      };
      button.textContent = 'Removing background...';
      setLiveProgress(65, 'Removing background', 2);
      setStatus('AI is separating the subject from the background. This can take a while on phones.');
      const outputBlob = await removeBackground(currentFile, config);
      if (!(outputBlob instanceof Blob) || outputBlob.size === 0) {
        throw new Error('The AI returned an empty image.');
      }
      setLiveProgress(92, 'Preparing download', 3);
      const url = URL.createObjectURL(outputBlob);
      mountManualEditor(url, imageState.src, 'Background Remover — compare & refine');
      setLiveProgress(100, 'Complete', 4);
      setStatus('Background removed! Compare Before/After, then use Erase or Restore to refine edges and download PNG.');
      setTimeout(() => URL.revokeObjectURL(url), 10 * 60 * 1000);
    } catch (error) {
      console.error('Background removal failed:', error);
      const detail = error && error.message ? error.message : String(error);
      setStatus('Background remover failed: ' + detail + '. Check whether your network allows esm.sh and staticimgly.com, then retry. The AI runs in your browser; no API key is needed.', true);
    } finally {
      button.disabled = false;
      button.textContent = 'Process Image';
    }
    return;
  }

  // Browser-based color effect: useful for a preview, but not AI reconstruction.
  if (currentTool[0] === 'Photo Colorize') {
    button.disabled = true;
    button.textContent = 'Colorizing...';
    setLiveProgress(15, 'Analyzing tones', 0);
    setStatus('Applying a basic browser color effect. This is a demo effect, not AI restoration of historically accurate colors.');
    try {
      await new Promise(resolve => setTimeout(resolve, 180));
      const image = await loadImage(imageState.src);
      setLiveProgress(45, 'Applying color', 1);
      const canvas = createCanvas(image.naturalWidth, image.naturalHeight);
      const ctx = canvas.getContext('2d');
      ctx.filter = 'saturate(1.7) sepia(0.18) contrast(1.08)';
      ctx.drawImage(image, 0, 0);
      ctx.filter = 'none';
      setLiveProgress(82, 'Exporting image', 3);
      await exportCanvas(canvas, 'image/png');
      setLiveProgress(100, 'Complete', 4);
      setStatus('Color effect exported. Note: true AI black-and-white photo colorization needs a dedicated model/service.');
    } catch (error) {
      setStatus(error.message || 'Color effect failed.', true);
    } finally {
      button.disabled = false;
      button.textContent = 'Process Image';
    }
    return;
  }

  if (action === 'eraser') {
    const canvas = document.getElementById('manualCanvas');
    if (!canvas) { setStatus('Upload an image to open the manual eraser.', true); return; }
    canvas.toBlob(blob => {
      if (!blob) { setStatus('Could not export edited image.', true); return; }
      downloadBlob(blob, (currentFile.name.replace(/\.[^.]+$/, '') || 'image') + '-edited.png');
      setStatus('Manual eraser result downloaded as PNG.');
    }, 'image/png');
    return;
  }
  if (action === 'advanced') {
    setStatus('This feature needs its own AI model or processing backend and is not connected yet.', true);
    return;
  }
  button.disabled = true;
  button.textContent = 'Processing...';
  setLiveProgress(15, 'Preparing image', 0);
  setStatus('Please wait while your image is processed.');

  try {
    const image = await loadImage(imageState.src);
    setLiveProgress(42, 'Processing image', 1);
    await new Promise(resolve => setTimeout(resolve, 80));
    let canvas;

    switch (action) {
      case 'compress': {
        const format = getOption('compressFormat', 'image/jpeg');
        const requested = Number(getOption('targetSize', 48));
        const unit = getOption('targetUnit', 'KB');
        const targetBytes = requested * (unit === 'MB' ? 1024 * 1024 : 1024);
        if (!Number.isFinite(requested) || requested <= 0) throw new Error('Enter a target size greater than zero.');

        const originalWidth = image.naturalWidth;
        const originalHeight = image.naturalHeight;
        const requestedQuality = Math.max(0.1, Math.min(1, Number(getOption('quality', 80)) / 100));
        let bestBlob = null, bestQuality = requestedQuality, bestWidth = originalWidth, bestHeight = originalHeight;
        let metTarget = false;
        const encode = (w, h, quality) => new Promise((resolve, reject) => {
          const c = createCanvas(w, h);
          const cctx = c.getContext('2d');
          cctx.drawImage(image, 0, 0, w, h);
          c.toBlob(blob => blob ? resolve(blob) : reject(new Error('This browser could not encode the image.')), format, quality);
        });

        // Search quality with binary search instead of stepping down in large jumps.
        // If even the lowest quality is too large, gradually reduce dimensions as a fallback.
        let width = originalWidth, height = originalHeight;
        for (let dimensionPass = 0; dimensionPass < 12; dimensionPass++) {
          let low = 0.05, high = requestedQuality;
          let passBestUnder = null, passBestAny = null, passQualityUnder = low, passQualityAny = low;
          for (let i = 0; i < 12; i++) {
            const q = (low + high) / 2;
            const blob = await encode(width, height, q);
            if (!passBestAny || blob.size < passBestAny.size) { passBestAny = blob; passQualityAny = q; }
            if (blob.size <= targetBytes) {
              if (!passBestUnder || blob.size > passBestUnder.size) {
                passBestUnder = blob; passQualityUnder = q;
              }
              low = q; // Try higher quality while staying within target.
            } else {
              high = q; // Too large: reduce quality.
            }
            if (Math.abs(high - low) < 0.003) break;
          }
          if (passBestUnder) {
            bestBlob = passBestUnder; bestQuality = passQualityUnder;
            bestWidth = width; bestHeight = height; metTarget = true;
            break;
          }
          // Nothing fits at this resolution, so try smaller dimensions.
          if (!bestBlob || passBestAny.size < bestBlob.size) {
            bestBlob = passBestAny; bestQuality = passQualityAny; bestWidth = width; bestHeight = height;
          }
          const scale = Math.min(0.88, Math.sqrt(targetBytes / Math.max(1, (passBest || bestBlob).size)) * 0.94);
          const nextW = Math.max(1, Math.floor(width * scale));
          const nextH = Math.max(1, Math.floor(height * scale));
          if (nextW === width && nextH === height) break;
          width = nextW; height = nextH;
        }
        if (!bestBlob) throw new Error('Could not compress this image.');
        // Final result prefers the closest file at or under target size.
        const ext = format === 'image/webp' ? 'webp' : 'jpg';
        const base = (currentFile.name || 'image').replace(/\\.[^.]+$/, '');
        const filename = base + '-compressed.' + ext;
        downloadBlob(bestBlob, filename);
        const resultArea = document.getElementById('resultArea');
        if (resultArea) {
          const actualKB = bestBlob.size / 1024;
          const targetKB = targetBytes / 1024;
          const sizeMessage = metTarget
            ? 'Target met: output is at or below your requested size.'
            : 'Exact target was not possible even after reducing dimensions; this is the closest small result found.';
          resultArea.innerHTML = '<div class="result-success"><h3>✅ Image compressed</h3><p>Original: ' +
            (currentFile.size / 1024).toFixed(1) + ' KB · Output: ' + actualKB.toFixed(1) +
            ' KB · Target: ' + targetKB.toFixed(1) + ' KB</p><p>Output dimensions: ' + bestWidth + ' × ' + bestHeight +
            (bestWidth !== originalWidth || bestHeight !== originalHeight ? ' (resized to meet size)' : '') +
            '</p><p>' + sizeMessage + '</p><button class="secondary" id="downloadAgain" type="button">Download Again</button></div>';
          document.getElementById('downloadAgain').onclick = () => downloadBlob(bestBlob, filename);
        }
        setLiveProgress(100, 'Complete', 4);
        setStatus('Compression complete: ' + (bestBlob.size / 1024).toFixed(1) + ' KB. Output dimensions ' + bestWidth + ' × ' + bestHeight + '.');
        break;
      }
      case 'resize': {
        const originalWidth = image.naturalWidth;
        const originalHeight = image.naturalHeight;

        let width = Number(getOption('width', originalWidth));
        let height = Number(getOption('height', originalHeight));

        if (
          !Number.isFinite(width) ||
          !Number.isFinite(height) ||
          width < 1 ||
          height < 1
        ) {
          throw new Error('Please enter valid image dimensions.');
        }

        if (getOption('aspect', true)) {
          const ratio = originalWidth / originalHeight;

          if (width !== originalWidth) {
            height = Math.round(width / ratio);
          } else {
            width = Math.round(height * ratio);
          }
        }

        validateDimensions(width, height);

        canvas = createCanvas(width, height);
        canvas.getContext('2d').drawImage(image, 0, 0, width, height);

        await exportCanvas(canvas, 'image/png');
        break;
      }

      case 'convert': {
        const format = getOption('format', 'image/png');

        canvas = createCanvas(image.naturalWidth, image.naturalHeight);

        const ctx = canvas.getContext('2d');

        // JPEG does not support transparency.
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(image, 0, 0);

        await exportCanvas(
          canvas,
          format,
          (format === 'image/jpeg' || format === 'image/webp' || format === 'image/avif') ? 0.92 : undefined
        );
        break;
      }

      case 'upscale': {
        const scale = Number(getOption('scale', 2));
        const width = image.naturalWidth * scale;
        const height = image.naturalHeight * scale;

        validateDimensions(width, height);

        canvas = createCanvas(width, height);

        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, width, height);

        await exportCanvas(canvas, 'image/png');
        setStatus(
          'Image enlarged using browser scaling. AI super-resolution is not connected.'
        );
        break;
      }

      case 'enhance': {
        canvas = renderEnhancedCanvas(image);
        await exportCanvas(canvas, 'image/png');
        break;
      }

      case 'rotate': {
        const rotation = Number(getOption('rotation', 90));
        const flipH = getOption('flipH', false);
        const flipV = getOption('flipV', false);

        const swapDimensions = rotation === 90 || rotation === 270;

        const width = swapDimensions
          ? image.naturalHeight
          : image.naturalWidth;

        const height = swapDimensions
          ? image.naturalWidth
          : image.naturalHeight;

        canvas = createCanvas(width, height);

        const ctx = canvas.getContext('2d');

        ctx.translate(width / 2, height / 2);
        ctx.rotate(rotation * Math.PI / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

        ctx.drawImage(
          image,
          -image.naturalWidth / 2,
          -image.naturalHeight / 2
        );

        await exportCanvas(canvas, 'image/png');
        break;
      }

      case 'expand': {
        const percent = Number(getOption('expand', 20)) / 100;

        const extraWidth = Math.round(image.naturalWidth * percent);
        const extraHeight = Math.round(image.naturalHeight * percent);

        const width = image.naturalWidth + extraWidth * 2;
        const height = image.naturalHeight + extraHeight * 2;

        validateDimensions(width, height);

        canvas = createCanvas(width, height);

        const ctx = canvas.getContext('2d');
        const background = getOption('background', '#ffffff');

        if (background !== 'transparent') {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(
          image,
          extraWidth,
          extraHeight,
          image.naturalWidth,
          image.naturalHeight
        );

        await exportCanvas(canvas, 'image/png');
        break;
      }

      case 'watermark': {
        canvas = createCanvas(image.naturalWidth, image.naturalHeight);

        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0);

        const text = String(getOption('watermark', 'Pixel Refine'));
        const size = Number(getOption('watermarkSize', 36));
        const opacity = Number(getOption('watermarkOpacity', 40)) / 100;

        if (!text.trim()) {
          throw new Error('Please enter watermark text.');
        }

        ctx.save();
        ctx.globalAlpha = Math.min(1, Math.max(0.05, opacity));
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = Math.max(1, size / 18);
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';

        const x = canvas.width - 20;
        const y = canvas.height - 20;

        ctx.strokeText(text, x, y);
        ctx.fillText(text, x, y);
        ctx.restore();

        await exportCanvas(canvas, 'image/png');
        break;
      }

      case 'crop': {
        let cropWidth = image.naturalWidth;
        let cropHeight = image.naturalHeight;
        const shape = getOption('cropShape', 'rectangle');

        const ratio = getOption('cropRatio', 'free');

        if (ratio !== 'free') {
          const parts = ratio.split(':').map(Number);
          const targetRatio = parts[0] / parts[1];
          const imageRatio = cropWidth / cropHeight;

          if (imageRatio > targetRatio) {
            cropWidth = Math.round(cropHeight * targetRatio);
          } else {
            cropHeight = Math.round(cropWidth / targetRatio);
          }
        }

        if (shape === 'square' || shape === 'circle') cropWidth = cropHeight = Math.min(cropWidth, cropHeight);
        const sx = Math.floor((image.naturalWidth - cropWidth) / 2);
        const sy = Math.floor((image.naturalHeight - cropHeight) / 2);

        let outputWidth = cropWidth;
        let outputHeight = cropHeight;
        const pixelPreset = getOption('cropPixels', 'original');
        if (pixelPreset === 'custom') {
          outputWidth = Math.max(1, Math.min(12000, Number(getOption('cropCustomWidth', 1080)) || 1080));
          outputHeight = Math.max(1, Math.min(12000, Number(getOption('cropCustomHeight', 1080)) || 1080));
        } else if (pixelPreset !== 'original') {
          const dimensions = pixelPreset.split('x').map(Number);
          outputWidth = dimensions[0];
          outputHeight = dimensions[1];
        }

        canvas = createCanvas(outputWidth, outputHeight);
        const cropCtx = canvas.getContext('2d');
        if (shape === 'circle') {
          cropCtx.beginPath();
          cropCtx.arc(outputWidth / 2, outputHeight / 2, Math.min(outputWidth, outputHeight) / 2, 0, Math.PI * 2);
          cropCtx.clip();
        }
        cropCtx.drawImage(image, sx, sy, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);
        await exportCanvas(canvas, 'image/png');
        break;
      }

      default:
        throw new Error('This tool has not been implemented yet.');
    }
  } catch (error) {
    console.error('Pixel Refine processing error:', error);
    setStatus(error.message || 'Something went wrong.', true);
  } finally {
    const currentButton = document.getElementById('processBtn');

    if (currentButton) {
      currentButton.disabled = !currentFile || !imageState;
      currentButton.textContent = 'Process Image';
    }
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(
      new Error('Could not load the image. Please try another file.')
    );

    img.src = src;
  });
}

function createCanvas(width, height) {
  validateDimensions(width, height);

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);

  return canvas;
}

function validateDimensions(width, height) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1 ||
    width > 12000 ||
    height > 12000
  ) {
    throw new Error(
      'Image dimensions must be between 1 and 12,000 pixels.'
    );
  }

  if (width * height > 40000000) {
    throw new Error(
      'This image is too large to process safely in your browser.'
    );
  }
}

function exportCanvas(canvas, type = 'image/png', quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error('Could not create the output image.'));
        return;
      }
      if (type && blob.type && blob.type !== type) {
        reject(new Error('This browser does not support ' + type.split('/')[1].toUpperCase() + ' export. Please choose PNG, JPG, or WebP.'));
        return;
      }

      downloadBlob(blob, getOutputFilename(type));

      const resultArea = document.getElementById('resultArea');

      if (resultArea) {
        resultArea.innerHTML = `
          <div class="result-success">
            <h3>✅ Image processed successfully!</h3>
            <p>Your download should start automatically.</p>
            <p>Output size: ${(blob.size / 1024).toFixed(1)} KB</p>
            <button class="secondary" id="downloadAgain" type="button">
              Download Again
            </button>
          </div>
        `;

        document.getElementById('downloadAgain').onclick = () => {
          downloadBlob(blob, getOutputFilename(type));
        };
      }

      setStatus('Processing complete.');
      resolve(blob);
    }, type, quality);
  });
}

function getOutputFilename(type) {
  const extensions = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp'
  };

  const extension = extensions[type] || 'png';
  const base = (currentFile?.name || 'pixel-refine-image')
    .replace(/\.[^.]+$/, '')
    .replace(/[^\w-]+/g, '-');

  return `${base}-pixel-refine.${extension}`;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* End of Part 3 */
/* ==========================================
   PIXEL REFINE — PART 4
   QR, password, barcode, theme and coins
   ========================================== */

/* ---------- Theme / Dark Mode ---------- */

function setupTheme() {
  const savedTheme = localStorage.getItem('pixelRefineTheme');
  const prefersDark = window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const dark = savedTheme ? savedTheme === 'dark' : prefersDark;

  document.body.classList.toggle('dark-mode', dark);
}

function toggleTheme() {
  const dark = document.body.classList.toggle('dark-mode');

  localStorage.setItem(
    'pixelRefineTheme',
    dark ? 'dark' : 'light'
  );
}

setupTheme();

/* Connect the actual header theme button in index.html. */
const themeButton = document.getElementById('themeBtn');
if (themeButton) {
  themeButton.addEventListener('click', () => {
    toggleTheme();
    themeButton.textContent = document.body.classList.contains('dark-mode') ? '☀' : '☾';
    themeButton.setAttribute('aria-label', document.body.classList.contains('dark-mode') ? 'Switch to light mode' : 'Switch to dark mode');
  });
  themeButton.textContent = document.body.classList.contains('dark-mode') ? '☀' : '☾';
}

/* ---------- Daily demo coins ---------- */

const PR_COINS_KEY = 'pixelRefineCoins';
const PR_DAILY_KEY = 'pixelRefineDailyReward';

function getCoins() {
  const value = Number(localStorage.getItem(PR_COINS_KEY));
  return Number.isFinite(value) && value >= 0 ? value : 10;
}

function saveCoins(value) {
  const safeValue = Math.max(0, Math.floor(Number(value) || 0));
  localStorage.setItem(PR_COINS_KEY, String(safeValue));
  updateCoinDisplay();
}

function updateCoinDisplay() {
  const display = document.getElementById('coinCount') || document.getElementById('coinBalance');
  if (display) display.textContent = String(getCoins());
}

function claimDailyCoins() {
  const lastClaim = localStorage.getItem(PR_DAILY_KEY);

  if (lastClaim === PR.localDay()) {
    return false;
  }

  saveCoins(getCoins() + 10);
  localStorage.setItem(PR_DAILY_KEY, PR.localDay());

  return true;
}

if (localStorage.getItem(PR_COINS_KEY) === null) {
  localStorage.setItem(PR_COINS_KEY, '10');
}

updateCoinDisplay();


/* ---------- Header account, coin and settings controls (demo only) ---------- */
function showInfoModal(title, bodyHtml) {
  content.innerHTML = `<h2>${title}</h2>${bodyHtml}`;
  modal.classList.add('show');
}
const accountButton = document.getElementById('accountBtn');
if (accountButton) {
  accountButton.addEventListener('click', () => {
    showInfoModal('Pixel Refine account', `
      <p>This is a front-end demo. Secure accounts and password storage need a backend.</p>
      <label>Email <input id="demoEmail" type="email" autocomplete="email" placeholder="you@example.com"></label>
      <button class="primary" id="demoContinue" type="button">Continue</button>
      <p id="demoAccountStatus" role="status"></p>`);
    document.getElementById('demoContinue').onclick = () => {
      const emailInput = document.getElementById('demoEmail');
      const email = emailInput.value.trim();
      const status = document.getElementById('demoAccountStatus');
      emailInput.value = email;

      // Avoid browser-specific type=email validity quirks; validate the trimmed value directly.
      const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailLooksValid) {
        status.textContent = 'Enter an email in the format name@example.com.';
        emailInput.focus();
        return;
      }

      status.textContent = 'Email format looks valid. Sign-in is still demo-only because a secure account service has not been connected yet.';
    };
  });
}
const coinPill = document.getElementById('coinPill');
if (coinPill) coinPill.addEventListener('click', () => {
  showInfoModal('Your coins', `<p>You have <strong>${getCoins()}</strong> demo coins.</p>
    <p>Daily reward: 10 coins (stored only in this browser).</p>
    <button class="primary" id="claimCoins" type="button">Claim daily 10 coins</button>
    <p id="coinStatus" role="status"></p>`);
  document.getElementById('claimCoins').onclick = () => {
    const ok = claimDailyCoins();
    document.getElementById('coinStatus').textContent = ok ? '10 demo coins added!' : 'You have already claimed today’s reward.';
    updateCoinDisplay();
  };
});
const settingsButton = document.getElementById('settingsBtn');
if (settingsButton) settingsButton.addEventListener('click', () => {
  showInfoModal('Settings', `<p>Theme: ${document.body.classList.contains('dark-mode') ? 'Dark' : 'Light'}.</p>
    <button class="secondary" id="settingsTheme" type="button">Toggle theme</button>
    <p>Account and coins are demo-only until a backend is connected.</p>`);
  document.getElementById('settingsTheme').onclick = () => {
    toggleTheme();
    closeModal();
  };
});
document.querySelectorAll('.plan-btn').forEach(button => button.addEventListener('click', () => {
  showInfoModal('Plans & payments', '<p>Checkout is not connected yet. Do not enter payment details here. A payment provider and backend must be configured before plans can be purchased.</p>');
}));

/* ---------- Password Generator ---------- */

function passwordTool() {
  content.innerHTML = `
    <h2>Password Generator</h2>
    <p>Generate a random password in your browser.</p>

    <label>
      Password length
      <input id="passwordLength" type="number"
        min="8" max="128" value="16">
    </label>

    <label>
      <input id="passwordSymbols" type="checkbox" checked>
      Include symbols
    </label>

    <button class="primary" id="generatePassword" type="button">
      Generate Password
    </button>

    <input id="generatedPassword" readonly
      aria-label="Generated password" placeholder="Your password">

    <button class="secondary" id="copyPassword" type="button">
      Copy Password
    </button>

    <p id="passwordStatus" role="status"></p>
  `;

  modal.classList.add('show');

  document.getElementById('generatePassword').onclick = () => {
    const length = Number(
      document.getElementById('passwordLength').value
    );

    if (!Number.isInteger(length) || length < 8 || length > 128) {
      document.getElementById('passwordStatus').textContent =
        'Choose a length from 8 to 128.';
      return;
    }

    const symbols = document.getElementById('passwordSymbols').checked;
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
      (symbols ? '!@#$%^&*()-_=+[]{};:,.?' : '');

    if (!window.crypto || !window.crypto.getRandomValues) {
      document.getElementById('passwordStatus').textContent =
        'Secure random generation is not supported in this browser.';
      return;
    }

    const random = new Uint32Array(length);
    window.crypto.getRandomValues(random);

    let password = '';

    for (let i = 0; i < length; i++) {
      password += chars[random[i] % chars.length];
    }

    document.getElementById('generatedPassword').value = password;
    document.getElementById('passwordStatus').textContent =
      'Password generated. Store it securely.';
  };

  document.getElementById('copyPassword').onclick = async () => {
    const password = document.getElementById('generatedPassword').value;
    const status = document.getElementById('passwordStatus');

    if (!password) {
      status.textContent = 'Generate a password first.';
      return;
    }

    try {
      await navigator.clipboard.writeText(password);
      status.textContent = 'Password copied.';
    } catch {
      status.textContent =
        'Copy failed. Select the password and copy it manually.';
    }
  };
}

/* ---------- QR Code Generator ---------- */

/*
  To enable QR generation, include a QR library in index.html.
  This UI does not pretend to generate a QR code without that library.
*/

function qrTool() {
  content.innerHTML = `
    <h2>QR Code Generator</h2>
    <p>Enter text or a website address to create a QR code.</p>

    <label>
      Text or URL
      <input id="qrText" type="text"
        maxlength="2000" placeholder="https://example.com">
    </label>

    <button class="primary" id="generateQR" type="button">
      Generate QR Code
    </button>

    <div id="qrOutput"></div>
    <p id="qrStatus" role="status"></p>
  `;

  modal.classList.add('show');

  document.getElementById('generateQR').onclick = () => {
    const value = document.getElementById('qrText').value.trim();
    const output = document.getElementById('qrOutput');
    const status = document.getElementById('qrStatus');

    output.replaceChildren();

    if (!value) {
      status.textContent = 'Enter some text or a URL first.';
      return;
    }

    if (typeof window.QRCode === 'undefined') {
      status.textContent =
        'QR library is not connected yet. Add a QR code library to enable this tool.';
      return;
    }

    try {
      new window.QRCode(output, {
        text: value,
        width: 220,
        height: 220
      });

      status.textContent = 'QR code generated.';
    } catch {
      status.textContent = 'Could not generate the QR code.';
    }
  };
}

/* ---------- Barcode Generator ---------- */

/*
  Barcode generation requires a compatible barcode library,
  such as JsBarcode, to be loaded by index.html.
*/

function barcodeTool() {
  content.innerHTML = `
    <h2>Barcode Generator</h2>
    <p>Enter a value for a Code 39 barcode.</p>

    <label>
      Barcode text
      <input id="barcodeText" maxlength="40"
        placeholder="PRODUCT123">
    </label>

    <button class="primary" id="generateBarcode" type="button">
      Generate Barcode
    </button>

    <div id="barcodeOutput"></div>
    <p id="barcodeStatus" role="status"></p>
  `;

  modal.classList.add('show');

  document.getElementById('generateBarcode').onclick = () => {
    const value = document.getElementById('barcodeText').value.trim();
    const output = document.getElementById('barcodeOutput');
    const status = document.getElementById('barcodeStatus');

    output.replaceChildren();

    if (!value || !/^[A-Za-z0-9 .\-$/+%]+$/.test(value)) {
      status.textContent =
        'Enter valid Code 39 characters: letters, numbers, spaces, and supported symbols.';
      return;
    }

    if (typeof window.JsBarcode !== 'function') {
      status.textContent =
        'Barcode library is not connected yet.';
      return;
    }

    const svg = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'svg'
    );

    output.appendChild(svg);

    try {
      window.JsBarcode(svg, value.toUpperCase(), {
        format: 'CODE39',
        displayValue: true,
        width: 2,
        height: 80
      });

      status.textContent = 'Barcode generated.';
    } catch {
      output.replaceChildren();
      status.textContent = 'Could not generate this barcode.';
    }
  };
}

/* ---------- Other Utility Tools ---------- */

function utilityTool() {
  content.innerHTML = `
    <h2>Utilities</h2>
    <p>Select a utility to continue.</p>

    <button class="primary" id="openPassword" type="button">
      Password Generator
    </button>

    <button class="secondary" id="openQR" type="button">
      QR Code Generator
    </button>

    <button class="secondary" id="openBarcode" type="button">
      Barcode Generator
    </button>
  `;

  modal.classList.add('show');

  document.getElementById('openPassword').onclick = passwordTool;
  document.getElementById('openQR').onclick = qrTool;
  document.getElementById('openBarcode').onclick = barcodeTool;
}

/* ---------- Account for unfinished tool routing ---------- */

function openToolByName(name) {
  const index = tools.findIndex(
    item => item[0].toLowerCase() === String(name).toLowerCase()
  );

  if (index < 0) {
    alert('Tool not found.');
    return;
  }

  openTool(index);
}

/* ---------- Initial render ---------- */

if (grid && search && count) {
  render();
}

/* End of Part 4 */
