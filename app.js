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
    <div class="drop" id="dropZone">
      <div class="upload-icon">☁️</div>
      <b>Upload your ${t[3] === 'pdf' ? 'document' : 'image'}</b>
      <br><span class="upload-hint">Tap to browse or drag & drop</span>
      <input type="file" id="fileInput" accept="${accept}" aria-label="Choose file">
            <div class="upload-actions">
        <button class="primary" id="chooseFile" type="button">Choose File</button>
      </div>
    </div>

    <div id="previewArea" hidden>
      <img id="preview" alt="Image preview">
      <p id="fileInfo"></p>
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
    <div id="resultArea"></div>
  `;

  modal.classList.add('show');

  const input = document.getElementById('fileInput');
  const drop = document.getElementById('dropZone');
  const choose = document.getElementById('chooseFile');
  const process = document.getElementById('processBtn');

  choose.onclick = () => input.click();
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
    addOption('Quality', 'quality', 'range', 80, 10, 100);
  } else if (t[4] === 'resize') {
    addOption('Width (px)', 'width', 'number', 800, 1, 12000);
    addOption('Height (px)', 'height', 'number', 800, 1, 12000);
    addOption('Lock aspect ratio', 'aspect', 'checkbox', true);
  } else if (t[4] === 'convert') {
    addOption('Output format', 'format', 'select', 'image/png', [
      ['image/png', 'PNG'],
      ['image/jpeg', 'JPG'],
      ['image/webp', 'WebP']
    ]);
  } else if (t[4] === 'upscale') {
    addOption('Scale factor', 'scale', 'select', '2', [
      ['2', '2×'],
      ['3', '3×'],
      ['4', '4×']
    ]);
  } else if (t[4] === 'enhance') {
    addOption('Brightness', 'brightness', 'range', 100, 0, 200);
    addOption('Contrast', 'contrast', 'range', 110, 0, 200);
    addOption('Saturation', 'saturation', 'range', 110, 0, 200);
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
    addOption('Crop ratio', 'cropRatio', 'select', 'free', [
      ['free', 'Free'],
      ['1:1', 'Square 1:1'],
      ['4:5', 'Portrait 4:5'],
      ['3:4', 'Portrait 3:4'],
      ['16:9', 'Landscape 16:9']
    ]);
  }
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
  if (isImageTool && !file.type.startsWith('image/')) {
    setStatus('Please choose a valid image file.', true);
    return;
  }

  if (file.size > 50 * 1024 * 1024) {
    setStatus('File is too large. Maximum allowed size is 50 MB.', true);
    return;
  }

  if (!isImageTool) {
    setStatus('This document tool needs a PDF/Office processing service. Image tools accept images only.', true);
    return;
  }

  currentFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    const img = document.getElementById('preview');
    img.src = reader.result;
    document.getElementById('previewArea').hidden = false;
    document.getElementById('fileInfo').textContent =
      `${file.name} • ${(file.size / 1024).toFixed(1)} KB`;

    img.onload = () => {
      if (img.naturalWidth > 12000 || img.naturalHeight > 12000) {
        currentFile = null;
        document.getElementById('processBtn').disabled = true;
        setStatus('Image dimensions must not exceed 12,000 × 12,000 pixels.', true);
        return;
      }

      imageState = {
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight
      };

      document.getElementById('processBtn').disabled = false;
      setLiveProgress(0, 'Ready', 0);
      setStatus('Image ready to process. Live stages will update while the tool runs.');
      if (currentTool && currentTool[0] === 'Magic Eraser') { setStatus('Manual Magic Eraser is ready below: use Erase/Restore, then Download PNG.'); mountManualEditor(imageState.src, null, 'Magic Eraser — manual brush editor'); }
    };
  };

  reader.onerror = () => setStatus('Could not read this file. Please try another one.', true);
  reader.readAsDataURL(file);
    }
/* ==========================================
   PIXEL REFINE — PART 3
   Image processing and download functions
   ========================================== */

async function processCurrentTool() {
  if (!currentTool || !currentFile || !imageState) {
    setStatus(currentTool && currentTool[3] === 'pdf' && currentTool[0] !== 'Image to PDF'
      ? 'This PDF workflow is not implemented yet. Image to PDF is available; other PDF tools still need PDF-specific processing.'
      : 'Please upload an image first.', true);
    return;
  }

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
      case 'compress':
        canvas = createCanvas(image.naturalWidth, image.naturalHeight);
        canvas.getContext('2d').drawImage(image, 0, 0);
        await exportCanvas(
          canvas,
          'image/jpeg',
          Number(getOption('quality', 80)) / 100
        );
        break;

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
          format === 'image/jpeg' ? 0.92 : undefined
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
        canvas = createCanvas(image.naturalWidth, image.naturalHeight);

        const ctx = canvas.getContext('2d');
        ctx.filter = [
          `brightness(${Number(getOption('brightness', 100))}%)`,
          `contrast(${Number(getOption('contrast', 110))}%)`,
          `saturate(${Number(getOption('saturation', 110))}%)`
        ].join(' ');

        ctx.drawImage(image, 0, 0);
        ctx.filter = 'none';

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

        const sx = Math.floor((image.naturalWidth - cropWidth) / 2);
        const sy = Math.floor((image.naturalHeight - cropHeight) / 2);

        canvas = createCanvas(cropWidth, cropHeight);

        canvas.getContext('2d').drawImage(
          image,
          sx,
          sy,
          cropWidth,
          cropHeight,
          0,
          0,
          cropWidth,
          cropHeight
        );

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
      const email = document.getElementById('demoEmail').value.trim();
      const status = document.getElementById('demoAccountStatus');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status.textContent = 'Please enter a valid email address.';
        return;
      }
      status.textContent = 'Demo only: sign-in is not connected to a secure account service yet.';
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
