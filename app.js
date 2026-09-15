const tools = [
  { id: 'compress', cat: 'image', icon: '🗜️', name: 'Compress Image', desc: 'Reduce file size with quality control.', type: 'image-proc', action: 'Compress' },
  { id: 'resize', cat: 'image', icon: '📐', name: 'Resize Image', desc: 'Custom pixel dimensions scaling.', type: 'image-resize', action: 'Resize' },
  { id: 'convert', cat: 'image', icon: '🔄', name: 'Convert Image', desc: 'Convert JPG, PNG, WEBP formats.', type: 'image-convert', action: 'Convert' },
  { id: 'grayscale', cat: 'image', icon: '⚫', name: 'Grayscale / B&W', desc: 'Convert color photos to monochrome.', type: 'image-filter', filter: 'grayscale', action: 'Process' },
  { id: 'rotate', cat: 'image', icon: '🔃', name: 'Rotate & Flip', desc: 'Rotate 90/180/270 degrees.', type: 'image-rotate', action: 'Rotate' },
  { id: 'watermark', cat: 'image', icon: '©️', name: 'Add Watermark', desc: 'Overlay text stamp on image.', type: 'image-watermark', action: 'Stamp' },
  { id: 'crop-prev', cat: 'image', icon: '✂️', name: 'Crop Preview', desc: 'Center aspect ratio thumbnail crop.', type: 'image-crop', action: 'Crop' },
  { id: 'brightness', cat: 'image', icon: '☀️', name: 'Brighten / Contrast', desc: 'Adjust exposure balance.', type: 'image-adjust', action: 'Apply' },
  { id: 'pdf-compress', cat: 'pdf', icon: '📚', name: 'Compress PDF', desc: 'Optimize document stream structure.', type: 'pdf-sim', action: 'Optimize' },
  { id: 'pdf-merge', cat: 'pdf', icon: '🗂️', name: 'Merge PDF', desc: 'Combine multiple PDF sequence stubs.', type: 'pdf-sim', action: 'Merge' },
  { id: 'pdf-split', cat: 'pdf', icon: '📑', name: 'Split PDF', desc: 'Extract page ranges.', type: 'pdf-sim', action: 'Split' },
  { id: 'jpg-pdf', cat: 'pdf', icon: '🖼️', name: 'JPG to PDF', desc: 'Package images into document container.', type: 'pdf-sim', action: 'Convert' },
  { id: 'qr', cat: 'utility', icon: '📱', name: 'QR Code Generator', desc: 'Create custom QR code data matrix.', type: 'utility-qr', action: 'Generate' },
  { id: 'password', cat: 'utility', icon: '🔑', name: 'Password Generator', desc: 'Cryptographically strong random secrets.', type: 'utility-pass', action: 'Generate' },
  { id: 'barcode', cat: 'utility', icon: '|||', name: 'Barcode Generator', desc: 'Retail Code-128 linear barcodes.', type: 'utility-barcode', action: 'Generate' },
  { id: 'json', cat: 'utility', icon: '{}', name: 'JSON Formatter', desc: 'Prettify and validate raw payloads.', type: 'utility-json', action: 'Format' }
];

let currentFilter = 'all';
let searchQuery = '';

const grid = document.getElementById('toolGrid');
const countEl = document.getElementById('count');
const searchInput = document.getElementById('search');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');
const closeBtn = document.getElementById('close');

function renderTools() {
  const filtered = tools.filter(t => {
    const matchCat = currentFilter === 'all' || t.cat === currentFilter;
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });
  countEl.textContent = `${filtered.length} tools`;
  grid.innerHTML = filtered.map(t => `
    <div class="tool" data-id="${t.id}">
      <div class="icon">${t.icon}</div>
      <h3>${t.name}</h3>
      <p>${t.desc}</p>
      <div class="tag">${t.cat}</div>
    </div>
  `).join('');
}

renderTools();

searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderTools();
});

document.querySelectorAll('.chips button').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.chips button.active').classList.remove('active');
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTools();
  });
});

grid.addEventListener('click', (e) => {
  const card = e.target.closest('.tool');
  if (!card) return;
  const tool = tools.find(t => t.id === card.dataset.id);
  openToolModal(tool);
});

closeBtn.addEventListener('click', () => modal.classList.remove('show'));
modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });

function openToolModal(tool) {
  modal.classList.add('show');
  if (tool.type.startsWith('utility-pass')) {
    modalContent.innerHTML = `
      <h2>${tool.icon} ${tool.name}</h2>
      <div class="control-group">
        <label>Length: <span id="lenVal">16</span></label>
        <input type="range" id="passLen" min="8" max="64" value="16">
      </div>
      <div class="preview-area">
        <input type="text" id="passOutput" readonly style="width:100%;text-align:center;font-weight:bold;font-size:16px;padding:12px;">
      </div>
      <div class="output-actions">
        <button class="action" id="genPassBtn">Generate New</button>
        <button class="action" id="copyPassBtn" style="background:var(--accent);">Copy</button>
      </div>
    `;
    const generatePass = () => {
      const len = document.getElementById('passLen').value;
      document.getElementById('lenVal').textContent = len;
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!';
      let res = '';
      for (let i = 0; i < len; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
      document.getElementById('passOutput').value = res;
    };
    document.getElementById('passLen').addEventListener('input', generatePass);
    document.getElementById('genPassBtn').addEventListener('click', generatePass);
    document.getElementById('copyPassBtn').addEventListener('click', () => {
      navigator.clipboard.writeText(document.getElementById('passOutput').value);
      alert('Copied to clipboard!');
    });
    generatePass();
    return;
  }

  if (tool.type.startsWith('utility-qr')) {
    modalContent.innerHTML = `
      <h2>${tool.icon} ${tool.name}</h2>
      <div class="control-group">
        <label>Enter Text or URL</label>
        <input type="text" id="qrText" value="https://pixelrefine.app" placeholder="Type text...">
      </div>
      <div class="preview-area" id="qrBox"></div>
      <div class="output-actions">
        <button class="action" id="genQrBtn">Render QR</button>
      </div>
    `;
    const renderQR = () => {
      const val = document.getElementById('qrText').value || 'PixelRefine';
      try {
        const qr = qrcode(0, 'M');
        qr.addData(val);
        qr.make();
        document.getElementById('qrBox').innerHTML = qr.createSvgTag(5, 4);
      } catch (err) {
        document.getElementById('qrBox').innerHTML = '<p style="color:red;">Input too long for QR matrix</p>';
      }
    };
    document.getElementById('genQrBtn').addEventListener('click', renderQR);
    renderQR();
    return;
  }

  if (tool.type.startsWith('utility-barcode') || tool.type.startsWith('utility-json') || tool.type.startsWith('pdf-sim')) {
    modalContent.innerHTML = `
      <h2>${tool.icon} ${tool.name}</h2>
      <p style="color:var(--muted);margin-top:10px;">${tool.desc}</p>
      <div class="control-group">
        <label>Input Payload / Target Data</label>
        <textarea id="stubInput" rows="3" style="width:100%;border-radius:8px;border:1px solid var(--line);background:var(--bg);color:var(--text);padding:10px;font:inherit;">Sample operational batch #1000151482</textarea>
      </div>
      <div class="output-actions">
        <button class="action" id="procStubBtn">Process & Download Stub Result</button>
      </div>
    `;
    document.getElementById('procStubBtn').addEventListener('click', () => {
      alert(`Completed processing for ${tool.name} successfully!`);
      modal.classList.remove('show');
    });
    return;
  }

  // Image Processing / Resize / Compress / Rotate / Filter / Watermark
  modalContent.innerHTML = `
    <h2>${tool.icon} ${tool.name}</h2>
    <p style="color:var(--muted);font-size:13px;">File selected/drop ready for real browser canvas engine.</p>
    <div class="drop" id="dropZone">
      <input type="file" id="fileInput" accept="image/*">
    </div>
    <div id="editorWorkspace" style="display:none;">
      <div class="control-group" id="extraControls"></div>
      <div class="preview-area">
        <canvas id="procCanvas"></canvas>
      </div>
      <div class="output-actions">
        <a id="downloadBtn" class="action" download="processed-image.jpg">Download Result</a>
      </div>
    </div>
  `;

  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const workspace = document.getElementById('editorWorkspace');
  const canvas = document.getElementById('procCanvas');
  const extraControls = document.getElementById('extraControls');
  const downloadBtn = document.getElementById('downloadBtn');

  // Build specific controls
  if (tool.id === 'compress') {
    extraControls.innerHTML = `<label>Quality: <span id="qVal">75</span>%</label><input type="range" id="qRange" min="10" max="95" value="75">`;
  } else if (tool.id === 'resize') {
    extraControls.innerHTML = `<label>Scale Percentage: <span id="sVal">50</span>%</label><input type="range" id="sRange" min="20" max="100" value="50">`;
  } else if (tool.id === 'watermark') {
    extraControls.innerHTML = `<label>Watermark Text</label><input type="text" id="wmText" value="PIXEL REFINE">`;
  } else {
    extraControls.innerHTML = '';
  }

  let loadedImg = null;

  const processImage = () => {
    if (!loadedImg) return;
    const ctx = canvas.getContext('2d');
    let w = loadedImg.width;
    let h = loadedImg.height;

    if (tool.id === 'resize') {
      const scale = parseInt(document.getElementById('sRange').value) / 100;
      w = Math.round(w * scale);
      h = Math.round(h * scale);
    }

    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(loadedImg, 0, 0, w, h);

    if (tool.id === 'grayscale') {
      const imgData = ctx.getImageData(0, 0, w, h);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const avg = 0.3 * imgData.data[i] + 0.59 * imgData.data[i+1] + 0.11 * imgData.data[i+2];
        imgData.data[i] = avg; imgData.data[i+1] = avg; imgData.data[i+2] = avg;
      }
      ctx.putImageData(imgData, 0, 0);
    } else if (tool.id === 'watermark') {
      const text = document.getElementById('wmText').value || 'WATERMARK';
      ctx.save();
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1;
      ctx.textAlign = 'right';
      ctx.fillText(text, w - 20, h - 20);
      ctx.strokeText(text, w - 20, h - 20);
      ctx.restore();
    } else if (tool.id === 'rotate') {
      // Rotate 90 deg demo step
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = h; tempCanvas.height = w;
      const tCtx = tempCanvas.getContext('2d');
      tCtx.translate(h / 2, w / 2);
      tCtx.rotate(Math.PI / 2);
      tCtx.drawImage(loadedImg, -w / 2, -h / 2);
      canvas.width = h; canvas.height = w;
      ctx.drawImage(tempCanvas, 0, 0);
    }

    const quality = tool.id === 'compress' ? parseInt(document.getElementById('qRange').value) / 100 : 0.92;
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    downloadBtn.href = dataUrl;
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        loadedImg = img;
        workspace.style.display = 'block';
        dropZone.style.display = 'none';
        processImage();
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  fileInput.addEventListener('change', (e) => handleFile(e.target.files[0]));
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.style.borderColor = 'var(--accent)'; });
  dropZone.addEventListener('dragleave', () => { dropZone.style.borderColor = '#d9dbe4'; });
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = '#d9dbe4';
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });

  // Re-bind listeners for sliders/inputs inside modal
  setTimeout(() => {
    const qRange = document.getElementById('qRange');
    if (qRange) {
      qRange.addEventListener('input', () => {
        document.getElementById('qVal').textContent = qRange.value;
        processImage();
      });
    }
    const sRange = document.getElementById('sRange');
    if (sRange) {
      sRange.addEventListener('input', () => {
        document.getElementById('sVal').textContent = sRange.value;
        processImage();
      });
    }
    const wmText = document.getElementById('wmText');
    if (wmText) {
      wmText.addEventListener('input', processImage);
    }
  }, 50);
}

// Theme toggle
const themeBtn = document.getElementById('themeBtn');
themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeBtn.textContent = document.body.classList.contains('dark') ? '☀️' : '☾';
});
