const compareImages = (userImageDataURL, templateSvgString) => {
  return new Promise((resolve) => {
    const imgUser = new Image();
    const imgTemplate = new Image();
    let loaded = 0; 

    // 1. Chuyển ảnh thành binary map (ma trận nhị phân 0/1)
    const getBinaryMap = (img) => {
      const size = 100; 
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const binary = new Uint8Array(size * size);
      for (let i = 0; i < data.length; i += 4) {
        binary[i / 4] = data[i + 3] > 20 ? 1 : 0;
      }
      return binary;
    };

    // 2. Tính bản đồ khoảng cách (Distance Transform) từ binary map
    //    Input: mảng binary (0/1), kích thước size x size
    //    Output: mảng dist, mỗi ô chứa khoảng cách Euclid gần nhất đến pixel nét (giá trị 1)
    //    Thuật toán: BFS đa nguồn trên lưới 8 hướng (4 hướng chính + 4 chéo)
    const computeDistanceMap = (binaryMap, size) => {
      const dist = new Float32Array(size * size).fill(Infinity); // khởi tạo khoảng cách vô cùng
      const queue = [];
      // Đưa tất cả pixel nét (giá trị 1) vào hàng đợi với khoảng cách 0
      for (let i = 0; i < binaryMap.length; i++) {
        if (binaryMap[i] === 1) {
          dist[i] = 0;
          queue.push(i);
        }
      }
      // 8 hướng di chuyển (dx, dy)
      const dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1], 
        [-1, -1], [-1, 1], [1, -1], [1, 1],
      ];
      // BFS
      while (queue.length) {
        const idx = queue.shift(); // lấy một pixel ra khỏi hàng đợi
        const x = idx % size;
        const y = Math.floor(idx / size);
        const cur = dist[idx]; // khoảng cách hiện tại
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const nidx = ny * size + nx;
            const nd = cur + Math.sqrt(dx * dx + dy * dy); // cộng thêm độ dài bước
            if (nd < dist[nidx]) {
              dist[nidx] = nd;
              queue.push(nidx); // thêm pixel lân cận vào hàng đợi
            }
          }
        }
      }
      return dist;
    };

    // --------------------------------------------------------
    // 3. Hàm kiểm tra, được gọi khi cả 2 ảnh đã load xong
    // --------------------------------------------------------
    const check = () => {
      loaded++;
      if (loaded === 2) {
        const userMap = getBinaryMap(imgUser);
        const templateMap = getBinaryMap(imgTemplate);
        const size = 100;

        let totalUserPixels = 0;
        for (let i = 0; i < userMap.length; i++) {
          if (userMap[i] === 1) totalUserPixels++;
        }
        if (totalUserPixels < 50) {
          resolve(false); // vẽ quá mờ hoặc quá ít
          return;
        }

        // Bản đồ khoảng cách từ user đến template (dùng để tính accuracy)
        const distUserToTemplate = computeDistanceMap(templateMap, size);
        let totalUser = 0, goodUser = 0;
        for (let i = 0; i < userMap.length; i++) {
          if (userMap[i] === 1) {
            totalUser++;
            // Nếu pixel user có khoảng cách đến mẫu <= 8 -> được tính là chính xác
            if (distUserToTemplate[i] <= 8) goodUser++;
          }
        }
        const accuracy = goodUser / (totalUser || 1); // tỷ lệ pixel "tốt" trên tổng pixel user

        // Bản đồ khoảng cách từ template đến user (dùng để tính coverage)
        const distTemplateToUser = computeDistanceMap(userMap, size);
        let totalTemplate = 0, coveredTemplate = 0;
        for (let i = 0; i < templateMap.length; i++) {
          if (templateMap[i] === 1) {
            totalTemplate++;
            // Nếu pixel mẫu có khoảng cách đến user <= 8 -> được coi là đã được bao phủ
            if (distTemplateToUser[i] <= 8) coveredTemplate++;
          }
        }
        const coverage = coveredTemplate / (totalTemplate || 1); // tỷ lệ bao phủ

        resolve(accuracy > 0.7 && coverage > 0.6);
      }
    };

    // Gán sự kiện onload cho cả hai ảnh
    imgUser.onload = check;
    imgTemplate.onload = check;

    // Bắt đầu tải ảnh user từ base64
    imgUser.src = userImageDataURL;
    // Tải ảnh template: chuyển SVG string thành Blob, tạo URL tạm rồi gán src
    const blob = new Blob([templateSvgString], { type: "image/svg+xml" });
    imgTemplate.src = URL.createObjectURL(blob);
  });
};

export default compareImages;