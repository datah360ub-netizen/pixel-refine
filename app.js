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

  const accept = t[3] === 'pdf' ? '.pdf,.doc,.docx' : 'image/*';

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
  if (!el) return;
  el.textContent = message;
  el.style.color = error ? '#dc2626' : '';
}

function loadFile(file) {
  if (!currentTool) return;

  const isImageTool = currentTool[3] === 'image';
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
      setStatus('Image ready to process.');
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
    setStatus('Please upload an image first.', true);
    return;
  }

  const action = currentTool[4];

  // These features require an actual AI service.
  if (action === 'advanced' || action === 'eraser') {
    setStatus(
      'This feature requires an AI model or backend API. It has not been connected yet.',
      true
    );
    return;
  }

  const button = document.getElementById('processBtn');
  button.disabled = true;
  button.textContent = 'Processing...';
  setStatus('Please wait while your image is processed.');

  try {
    const image = await loadImage(imageState.src);
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

/* Connect to a theme button if your HTML contains one. */
const themeButton = document.getElementById('themeToggle');

if (themeButton) {
  themeButton.addEventListener('click', toggleTheme);
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
  const display = document.getElementById('coinBalance');

  if (display) {
    display.textContent = String(getCoins());
  }
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
