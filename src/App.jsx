import { useState } from 'react';
import imgUp from './assets/img-up.png';
import imgDown from './assets/img-down.png';
import './App.css';
import domtoimage from 'dom-to-image-more';

function App() {
  const [rows, setRows] = useState(4);
  const [cols, setCols] = useState(10);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mainTitle, setMainTitle] = useState('MS:1234');
  const [mergedImg, setMergedImg] = useState(null);
  const [iconUpValue, setIconUpValue] = useState('0');
  const [iconDownValue, setIconDownValue] = useState('0');
  const [bigFrameImg, setBigFrameImg] = useState(null);
  const [gridImages, setGridImages] = useState({});
  const [draggedImage, setDraggedImage] = useState(null);
  const [dragSource, setDragSource] = useState(null);
  const [adjustModal, setAdjustModal] = useState({ show: false, imageIndex: null, image: null });
  const [imageAdjustments, setImageAdjustments] = useState({});
  const [cropFrame, setCropFrame] = useState({ x: 0, y: 0, width: 100, height: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageFits, setImageFits] = useState({});
  const [bottomFramesCount, setBottomFramesCount] = useState(3);
  const [bottomFrameImages, setBottomFrameImages] = useState({});
  const [bottomFramesLabel, setBottomFramesLabel] = useState("");

  // Xử lý chọn ảnh cho khung tổng hàng 1
  const handleMergedImg = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setMergedImg(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBigFrameImg = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setBigFrameImg(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleBottomFrameImages = (e) => {
    const files = Array.from(e.target.files);
    
    // Đọc tất cả ảnh
    const imagePromises = files.map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            index: index,
            image: e.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((results) => {
      const newBottomFrameImages = {};
      
      // Phân bổ ảnh vào các khung theo thứ tự
      results.forEach((result, i) => {
        if (i < bottomFramesCount) {
          newBottomFrameImages[i] = result.image;
        }
      });
      
      setBottomFrameImages(newBottomFrameImages);
    });
  };

  const handleGridImages = (e) => {
    const files = Array.from(e.target.files);
    
    // Tính số ô có thể upload ảnh (trừ khung tổng)
    let totalCells = 0;
    
    // Hàng 1: cols - 2 ô (trừ khung tổng avatar)
    totalCells += (cols - 2);
    
    // Hàng 2: cols - 4 ô (trừ khung tổng 4 ô)
    totalCells += (cols - 4);
    
    // Các hàng còn lại: rows - 2 hàng × cols ô
    totalCells += (rows - 2) * cols;
    
    // Đọc tất cả ảnh
    const imagePromises = files.map((file, index) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Kiểm tra xem ảnh có vừa với ô không
            const cellRatio = 85 / 120; // width/height của ô
            const imageRatio = img.width / img.height;
            
            const fits = imageRatio <= cellRatio; // Ảnh dọc hoặc vuông thì vừa
            
            resolve({
              index: index,
              image: e.target.result,
              fits: fits
            });
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(imagePromises).then((results) => {
      const newGridImages = {};
      const newImageFits = {};
      
      // Phân bổ ảnh vào các ô theo thứ tự
      results.forEach((result, i) => {
        if (i < totalCells) {
          newGridImages[i] = result.image;
          newImageFits[i] = result.fits;
        }
      });
      
      setGridImages(newGridImages);
      setImageFits(newImageFits);
    });
  };

  const handleDragStart = (e, imageIndex) => {
    setDraggedImage(gridImages[imageIndex]);
    setDragSource(imageIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedImage && dragSource !== null) {
      const newGridImages = { ...gridImages };
      
      // Hoán đổi ảnh
      const temp = newGridImages[targetIndex];
      newGridImages[targetIndex] = draggedImage;
      newGridImages[dragSource] = temp;
      
      setGridImages(newGridImages);
      setDraggedImage(null);
      setDragSource(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedImage(null);
    setDragSource(null);
  };

  const handleBottomFrameDragStart = (e, frameIndex) => {
    setDraggedImage(bottomFrameImages[frameIndex]);
    setDragSource(`bottom-${frameIndex}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBottomFrameDrop = (e, targetIndex) => {
    e.preventDefault();
    
    if (draggedImage && dragSource && dragSource.startsWith('bottom-')) {
      const sourceIndex = parseInt(dragSource.split('-')[1]);
      
      setBottomFrameImages(prev => {
        const newImages = { ...prev };
        newImages[targetIndex] = draggedImage;
        newImages[sourceIndex] = prev[targetIndex];
        return newImages;
      });
    }
  };

  const openAdjustModal = (imageIndex) => {
    console.log('Opening modal for image index:', imageIndex);
    if (gridImages[imageIndex]) {
      setAdjustModal({
        show: true,
        imageIndex: imageIndex,
        image: gridImages[imageIndex]
      });
      // Reset crop frame với tỷ lệ đúng của ô (85x120)
      const cellRatio = 85 / 120; // 0.708
      const modalWidth = 400;
      const modalHeight = 300;
      
      // Tính kích thước khung crop để có tỷ lệ đúng
      // Sử dụng tỷ lệ thực tế của ô
      const cropWidth = 85;
      const cropHeight = 120;
      
      // Căn giữa khung crop
      const x = (modalWidth - cropWidth) / 2;
      const y = (modalHeight - cropHeight) / 2;
      
      setCropFrame({ 
        x: x, 
        y: y, 
        width: cropWidth, 
        height: cropHeight 
      });
    }
  };

  const closeAdjustModal = () => {
    setAdjustModal({ show: false, imageIndex: null, image: null });
    setIsDragging(false);
  };

  const saveImageAdjustment = (cropData) => {
    console.log('Saving crop data:', cropData);
    console.log('For image index:', adjustModal.imageIndex);
    console.log('All grid images:', gridImages);
    setImageAdjustments(prev => {
      const newAdjustments = {
        ...prev,
        [adjustModal.imageIndex]: cropData
      };
      console.log('New adjustments:', newAdjustments);
      return newAdjustments;
    });
    
    // Force re-render bằng cách set lại state
    setTimeout(() => {
      console.log('Force re-rendering adjustments...');
      setImageAdjustments(current => {
        console.log('Current adjustments before re-render:', current);
        return { ...current };
      });
    }, 100);
    
    closeAdjustModal();
  };

  const handleCropFrameMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({
      x: e.clientX - cropFrame.x,
      y: e.clientY - cropFrame.y
    });
    console.log('Mouse down on crop frame, isDragging set to true, dragStart:', { x: e.clientX - cropFrame.x, y: e.clientY - cropFrame.y });
  };

  const handleCropFrameMouseMove = (e) => {
    if (!isDragging) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Giới hạn trong container (400x300)
    const maxX = 400 - cropFrame.width;
    const maxY = 300 - cropFrame.height;
    
    const clampedX = Math.max(0, Math.min(newX, maxX));
    const clampedY = Math.max(0, Math.min(newY, maxY));
    
    setCropFrame(prev => ({
      ...prev,
      x: clampedX,
      y: clampedY
    }));
    
    console.log('Mouse move, updating crop frame to:', { x: clampedX, y: clampedY });
  };

  const handleCropFrameMouseUp = (e) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      console.log('Mouse up, isDragging set to false');
    }
  };

  // Thay logic xóa ảnh trong gridImages:
  const handleRemoveGridImage = (imageIndex, rowIdx = null, colIdx = null) => {
    setGridImages(prev => {
      let newImgs = { ...prev };
      // Xác định vùng hàng
      let startIdx, endIdx;
      if (rowIdx === 0) {
        startIdx = 0;
        endIdx = cols - 2;
      } else if (rowIdx === 1) {
        startIdx = cols - 2;
        endIdx = cols - 2 + (cols - 4);
      } else if (rowIdx !== null) {
        const base = (cols - 2) + (cols - 4) + ((rowIdx - 2) * cols);
        startIdx = base;
        endIdx = base + cols;
      } else {
        delete newImgs[imageIndex];
        return newImgs;
      }
      // Lấy các ảnh của hàng
      const rowImgs = [];
      for (let i = startIdx; i < endIdx; i++) {
        if (i !== imageIndex && newImgs[i]) rowImgs.push(newImgs[i]);
      }
      // Dồn sang trái
      for (let i = startIdx; i < endIdx; i++) {
        newImgs[i] = rowImgs[i - startIdx] || undefined;
      }
      // Kiểm tra nếu hàng này trống hoàn toàn
      const isRowEmpty = rowImgs.length === 0;
      // Kiểm tra cột (chỉ với các hàng còn lại)
      let isColEmpty = false;
      if (colIdx !== null) {
        let colHasImg = false;
        for (let r = 0; r < rows; r++) {
          let idx;
          if (r === 0 && colIdx >= 0 && colIdx < cols - 2) idx = colIdx;
          else if (r === 1 && colIdx >= 0 && colIdx < cols - 4) idx = (cols - 2) + colIdx;
          else if (r >= 2) idx = (cols - 2) + (cols - 4) + ((r - 2) * cols) + colIdx;
          else continue;
          if (newImgs[idx]) { colHasImg = true; break; }
        }
        isColEmpty = !colHasImg;
      }
      // Nếu hàng trống, giảm rows
      if (isRowEmpty && rowIdx !== null && rowIdx >= 2) {
        setRows(r => Math.max(2, r - 1));
        // Xóa toàn bộ ảnh của hàng này
        for (let i = startIdx; i < endIdx; i++) delete newImgs[i];
      }
      // Nếu cột trống, giảm cols
      if (isColEmpty && colIdx !== null) {
        setCols(c => Math.max(1, c - 1));
        // Dồn lại các ảnh bên phải sang trái cho từng hàng
        for (let r = 0; r < rows; r++) {
          let rowStart, rowEnd, colCount;
          if (r === 0) {
            rowStart = 0;
            rowEnd = cols - 2;
            colCount = cols - 2;
          } else if (r === 1) {
            rowStart = cols - 2;
            rowEnd = cols - 2 + (cols - 4);
            colCount = cols - 4;
          } else {
            rowStart = (cols - 2) + (cols - 4) + ((r - 2) * cols);
            rowEnd = rowStart + cols;
            colCount = cols;
          }
          // Lấy các ảnh của hàng này, bỏ cột colIdx
          const rowImgs = [];
          for (let c = 0; c < colCount; c++) {
            const idx = rowStart + c;
            if (c !== colIdx && newImgs[idx]) rowImgs.push(newImgs[idx]);
          }
          // Dồn sang trái, cập nhật lại index
          for (let c = 0; c < colCount - 1; c++) {
            const idx = rowStart + c;
            newImgs[idx] = rowImgs[c] || undefined;
          }
          // Xóa ảnh ở cột cuối cùng của hàng này
          const lastIdx = rowStart + (colCount - 1);
          delete newImgs[lastIdx];
        }
      }
      return newImgs;
    });
  };

  return (
    <div className="container">
      {/* Sidebar toggle buttons */}
      {!sidebarOpen && (
        <button className="sidebar-toggle-open" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>
      )}
      {sidebarOpen && (
        <button className="sidebar-toggle-close" onClick={() => setSidebarOpen(false)}>
          ✖
        </button>
      )}
      {/* Sidebar */}
      <div className={`sidebar${sidebarOpen ? ' open' : ''}`}>
        <h3>Điều khiển lưới</h3>
        
        {/* Cài đặt lưới - 2 cột */}
        <div style={{marginBottom: 18}}>
          <div style={{fontWeight: 600, color: '#646cff', marginBottom: 6}}>Cài đặt lưới:</div>
          <div className="sidebar-row">
            <label>
              Số hàng:
              <input
                type="number"
                min={1}
                value={rows}
                onChange={e => setRows(Number(e.target.value))}
              />
            </label>
            <label>
              Số cột:
              <input
                type="number"
                min={1}
                value={cols}
                onChange={e => setCols(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        {/* Tiêu đề và số liệu - 2 cột */}
        <div style={{marginBottom: 18}}>
          <div style={{fontWeight: 600, color: '#646cff', marginBottom: 6}}>Tiêu đề lớn:</div>
          <input
            type="text"
            className="sidebar-title-input"
            placeholder="Nhập tiêu đề lớn..."
            value={mainTitle}
            onChange={e => setMainTitle(e.target.value)}
            style={{ marginBottom: 6, width: '100%' }}
          />
        </div>
        
        <div className="sidebar-row" style={{marginBottom: 18}}>
          <label>
            Tướng:
            <input type="number" className="sidebar-title-input" value={iconUpValue} onChange={e => setIconUpValue(e.target.value)} />
          </label>
          <label>
            Trang phục:
            <input type="number" className="sidebar-title-input" value={iconDownValue} onChange={e => setIconDownValue(e.target.value)} />
          </label>
        </div>

        {/* Upload ảnh - 1 cột */}
        <div className="sidebar-row" style={{marginBottom: 14}}>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1}}>
            <div className="sidebar-section-label">Avatar:</div>
            <label className="custom-file-upload" htmlFor="avatar-file-input">
              <span className="plus-icon">+</span> Thêm ảnh
              {mergedImg && <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>(1 ảnh)</span>}
            </label>
            <input
              id="avatar-file-input"
              className="input-file-hidden"
              type="file"
              accept="image/*"
              onChange={handleMergedImg}
            />
          </div>
          <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1}}>
            <div className="sidebar-section-label">Khung cấp bậc:</div>
            <label className="custom-file-upload" htmlFor="bigframe-file-input">
              <span className="plus-icon">+</span> Thêm ảnh
              {bigFrameImg && <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>(1 ảnh)</span>}
            </label>
            <input
              id="bigframe-file-input"
              className="input-file-hidden"
              type="file"
              accept="image/*"
              onChange={handleBigFrameImg}
            />
          </div>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-label">Ảnh lưới:</div>
          <label className="custom-file-upload" htmlFor="grid-file-input">
            <span className="plus-icon">+</span> Thêm ảnh
          </label>
          <input
            id="grid-file-input"
            className="input-file-hidden"
            type="file"
            accept="image/*"
            multiple
            onChange={handleGridImages}
          />
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-label">Khung chiến tích:</div>
          <div className="sidebar-row" style={{marginBottom: 0}}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
              <label style={{ fontWeight: 500, marginRight: 8 }}>Số khung:</label>
              <input
                type="number"
                min={1}
                value={bottomFramesCount}
                onChange={e => setBottomFramesCount(Math.max(1, Number(e.target.value)))}
                style={{ width: 60, background: '#333', color: 'white', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 16, textAlign: 'center' }}
              />
            </div>
            <label className="custom-file-upload" htmlFor="bottom-frame-file-input" style={{marginLeft: 10, flex: 1}}>
              <span className="plus-icon">+</span> Thêm ảnh
              {Object.keys(bottomFrameImages).length > 0 && (
                <span style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
                  ({Object.keys(bottomFrameImages).length} ảnh)
                </span>
              )}
            </label>
            <input
              id="bottom-frame-file-input"
              className="input-file-hidden"
              type="file"
              accept="image/*"
              multiple
              onChange={handleBottomFrameImages}
            />
          </div>
        </div>
      </div>
      {/* Overlay khi sidebar mở */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Bọc nút download và lưới trong 1 div riêng */}
      <div style={{ position: 'relative', width: '100%' }}>
        <button
          style={{
            position: 'absolute',
            top: -50,
            right: 0,
            zIndex: 10,
            background: '#667eea',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 22px',
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(102,126,234,0.18)'
          }}
          onClick={async () => {
            const grid = document.querySelector('.color-grid');
            if (!grid) return;
            grid.classList.add('download-mode');
            domtoimage.toPng(grid)
              .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = 'ghep-anh.png';
                link.href = dataUrl;
                link.click();
              })
              .catch((error) => {
                alert('Lỗi khi xuất ảnh: ' + error);
              })
              .finally(() => {
                grid.classList.remove('download-mode');
              });
          }}
        >
          Download
        </button>
        <div className="color-grid">
          {/* Tiêu đề lớn trên đầu lưới */}
          <div className="main-title-bar">
            {mainTitle}
            <div className="watermark-banner">toolsheap</div>
          </div>
          {/* Hàng đầu tiên: merge 2 ô đầu */}
          <div className="color-row">
            <div className="color-cell merged-cell" style={{ gridColumn: `span 2`, position: 'relative' }}>
              <div className="merged-img-box">
                {mergedImg ? (
                  <img src={mergedImg} alt="merged" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
                ) : (
                  <span className="merged-img-placeholder">90×90px</span>
                )}
              </div>
            </div>
            {Array.from({ length: cols - 2 }).map((_, colIdx) => {
              const imageIndex = colIdx;
              return (
                <div
                  className="color-cell cell-relative"
                  key={colIdx}
                  draggable={!!gridImages[imageIndex]}
                  onDragStart={(e) => handleDragStart(e, imageIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, imageIndex)}
                  onDragEnd={handleDragEnd}
                >
                                    {gridImages[imageIndex] ? (
                    <img
                      src={gridImages[imageIndex]}
                      alt={`grid-0-${colIdx}`}
                      key={`img-${imageIndex}-${imageAdjustments[imageIndex] ? 'adjusted' : 'normal'}`}
                    className={`grid-image ${imageFits[imageIndex] ? 'grid-image-contain' : 'grid-image-cover'}`}
                    style={{
                      objectPosition: imageAdjustments[imageIndex] ? `${imageAdjustments[imageIndex].x}% ${imageAdjustments[imageIndex].y}%` : '50% 50%'
                    }}
                    onClick={() => openAdjustModal(imageIndex)}
                  />
                ) : (
                  <span className="grid-cell-placeholder">Ảnh lưới</span>
                )}
                                 {gridImages[imageIndex] && (
                   <div className="drag-handle">⤡</div>
                 )}
                 {gridImages[imageIndex] && (
  <button
    className="grid-img-remove"
    onClick={e => {
      e.stopPropagation();
      handleRemoveGridImage(imageIndex, 0, colIdx);
    }}
    title="Xóa ảnh"
  >
    ×
  </button>
)}
              </div>
            );
          })}
        </div>
        {/* Hàng 2: merge 4 ô đầu */}
        <div className="color-row">
          <div className="color-cell merged-cell-4" style={{ gridColumn: `span 4`, position: 'relative' }}>
            <div className="merged-vertical-icons">
              <div className="merged-icon-box" style={{ backgroundImage: `url(${imgUp})` }}>
                <span className="merged-icon-value">{iconUpValue || 0}</span>
              </div>
              <div className="merged-icon-box" style={{ backgroundImage: `url(${imgDown})` }}>
                <span className="merged-icon-value">{iconDownValue || 0}</span>
              </div>
            </div>
            <div className="merged-big-frame">
              {bigFrameImg ? (
                <img src={bigFrameImg} alt="big frame" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <span className="merged-frame-placeholder">300×120px</span>
              )}
            </div>
          </div>
                      {Array.from({ length: cols - 4 }).map((_, colIdx) => {
            const imageIndex = (cols - 2) + colIdx;
            return (
              <div
                className="color-cell cell-relative"
                key={colIdx}
                draggable={!!gridImages[imageIndex]}
                onDragStart={(e) => handleDragStart(e, imageIndex)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, imageIndex)}
                onDragEnd={handleDragEnd}
              >
                                  {gridImages[imageIndex] ? (
                    <img
                      src={gridImages[imageIndex]}
                      alt={`grid-1-${colIdx}`}
                      key={`img-${imageIndex}-${imageAdjustments[imageIndex] ? 'adjusted' : 'normal'}`}
                      className={`grid-image ${imageAdjustments[imageIndex] ? 'grid-image-cover' : (imageFits[imageIndex] ? 'grid-image-contain' : 'grid-image-cover')}`}
                      style={{
                        objectPosition: imageAdjustments[imageIndex] ? `${imageAdjustments[imageIndex].x}% ${imageAdjustments[imageIndex].y}%` : '50% 50%'
                      }}
                                              onClick={() => {
                          console.log(`Clicking image index: ${imageIndex}, exists: ${!!gridImages[imageIndex]}, adjustments:`, imageAdjustments[imageIndex]);
                          console.log(`Image ${imageIndex} is being rendered in row/col:`, 1, colIdx);
                          openAdjustModal(imageIndex);
                        }}
                    />
                  ) : (
                    <span className="grid-cell-placeholder">Ảnh lưới</span>
                  )}
                  {gridImages[imageIndex] && (
                    <div className="drag-handle">⤡</div>
                  )}
                  {gridImages[imageIndex] && (
  <button
    className="grid-img-remove"
    onClick={e => {
      e.stopPropagation();
      handleRemoveGridImage(imageIndex, 1, colIdx);
    }}
    title="Xóa ảnh"
  >
    ×
  </button>
)}
              </div>
            );
          })}
        </div>
        {/* Các hàng còn lại */}
        {Array.from({ length: rows - 2 }).map((_, rowIdx) => (
          <div className="color-row" key={rowIdx}>
            {Array.from({ length: cols }).map((_, colIdx) => {
              // Tính index cho ảnh (bỏ qua 2 hàng đầu)
              const imageIndex = (cols - 2) + (cols - 4) + (rowIdx * cols + colIdx);
              return (
                <div
                  className="color-cell cell-relative"
                  key={colIdx}
                  draggable={!!gridImages[imageIndex]}
                  onDragStart={(e) => handleDragStart(e, imageIndex)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, imageIndex)}
                  onDragEnd={handleDragEnd}
                >
                                      {gridImages[imageIndex] ? (
                      <img
                        src={gridImages[imageIndex]}
                        alt={`grid-${rowIdx}-${colIdx}`}
                        key={`img-${imageIndex}-${imageAdjustments[imageIndex] ? 'adjusted' : 'normal'}`}
                        className={`grid-image ${imageFits[imageIndex] ? 'grid-image-contain' : 'grid-image-cover'}`}
                        style={{
                          objectPosition: imageAdjustments[imageIndex] ? `${imageAdjustments[imageIndex].x}% ${imageAdjustments[imageIndex].y}%` : '50% 50%'
                        }}
                        onClick={() => openAdjustModal(imageIndex)}
                      />
                    ) : (
                      <span className="grid-cell-placeholder">Ảnh lưới</span>
                    )}
                    {gridImages[imageIndex] && (
                      <div className="drag-handle">⤡</div>
                    )}
                    {gridImages[imageIndex] && (
  <button
    className="grid-img-remove"
    onClick={e => {
      e.stopPropagation();
      handleRemoveGridImage(imageIndex, rowIdx + 2, colIdx);
    }}
    title="Xóa ảnh"
  >
    ×
  </button>
)}
                </div>
              );
            })}
          </div>
        ))}
        
        {/* Khung lớn phía dưới - chỉ hiển thị khi có ảnh */}
        {Object.keys(bottomFrameImages).length > 0 && (
          <div className="bottom-frames-row">
            {Array.from({ length: bottomFramesCount }).map((_, index) => (
              <div 
                key={index} 
                className="bottom-frame"
                draggable={!!bottomFrameImages[index]}
                onDragStart={(e) => handleBottomFrameDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleBottomFrameDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                {bottomFrameImages[index] ? (
                  <img 
                    src={bottomFrameImages[index]} 
                    alt={`bottom-frame-${index}`}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover', 
                      borderRadius: 8,
                      position: 'absolute',
                      top: 0,
                      left: 0
                    }}
                  />
                ) : (
                  <span className="bottom-frame-placeholder">120×{Math.floor(400 / bottomFramesCount)}px</span>
                )}
                {bottomFrameImages[index] && (
                  <div className="drag-handle">⤡</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal crop ảnh */}
      {adjustModal.show && (
        <div className="modal-overlay" onClick={closeAdjustModal}>
          <div className="modal-content crop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crop ảnh</h3>
              <button className="modal-close" onClick={closeAdjustModal}>✖</button>
            </div>
            <div className="modal-body">
              <div className="crop-container" onMouseMove={handleCropFrameMouseMove} onMouseUp={handleCropFrameMouseUp}>
                <img 
                  src={adjustModal.image} 
                  alt="crop preview" 
                  className="crop-image modal-crop-image"
                />
                <div 
                  className="crop-frame crop-frame-position"
                  style={{
                    left: `${cropFrame.x}px`,
                    top: `${cropFrame.y}px`,
                    width: `${cropFrame.width}px`,
                    height: `${cropFrame.height}px`
                  }}
                  onMouseDown={handleCropFrameMouseDown}
                >
                  <div className="crop-handle top-left"></div>
                  <div className="crop-handle top-right"></div>
                  <div className="crop-handle bottom-left"></div>
                  <div className="crop-handle bottom-right"></div>
                  <div className="crop-handle top-center"></div>
                  <div className="crop-handle bottom-center"></div>
                  <div className="crop-handle left-center"></div>
                  <div className="crop-handle right-center"></div>
                </div>
              </div>
              <div className="crop-controls">
                <p>Kéo khung đỏ để chọn phần ảnh hiển thị</p>
                <p>Khung: {cropFrame.width}×{cropFrame.height}px tại ({cropFrame.x}, {cropFrame.y})</p>
                <button 
                  className="save-crop-btn"
                  onClick={() => {
                    // Tính toán vị trí center của crop frame
                    const centerX = cropFrame.x + (cropFrame.width / 2);
                    const centerY = cropFrame.y + (cropFrame.height / 2);
                    // Chuyển đổi thành phần trăm
                    const xPercent = (centerX / 400) * 100;
                    const yPercent = (centerY / 300) * 100;
                    saveImageAdjustment({
                      x: xPercent,
                      y: yPercent
                    });
                  }}
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        </div>
        
      )}
      </div>
    </div>
  );
}

export default App;
