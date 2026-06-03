// src/utils/compareImages.js
const compareImages = (userImageDataURL, templateSvgString) => {
  return new Promise((resolve) => {
    const imgUser = new Image();
    const imgTemplate = new Image();
    let loaded = 0;

    const getBinaryMap = (img, isTemplate = false) => {
      const size = 100;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (isTemplate) {
        ctx.lineWidth = 25;
        ctx.strokeStyle = "black";
        ctx.lineCap = "round";
      }
      ctx.drawImage(img, 0, 0, size, size);
      const data = ctx.getImageData(0, 0, size, size).data;
      const binary = new Uint8Array(size * size);
      for (let i = 0; i < data.length; i += 4) {
        binary[i / 4] = data[i + 3] > 20 ? 1 : 0;
      }
      return binary;
    };

    const computeDistanceMap = (binaryMap, size) => {
      const dist = new Float32Array(size * size).fill(Infinity);
      const queue = [];
      for (let i = 0; i < binaryMap.length; i++) {
        if (binaryMap[i] === 1) {
          dist[i] = 0;
          queue.push(i);
        }
      }
      const dirs = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [-1, 1], [1, -1], [1, 1],
      ];
      while (queue.length) {
        const idx = queue.shift();
        const x = idx % size;
        const y = Math.floor(idx / size);
        const cur = dist[idx];
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy;
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            const nidx = ny * size + nx;
            const nd = cur + Math.sqrt(dx * dx + dy * dy);
            if (nd < dist[nidx]) {
              dist[nidx] = nd;
              queue.push(nidx);
            }
          }
        }
      }
      return dist;
    };

    const check = () => {
      loaded++;
      if (loaded === 2) {
        const userMap = getBinaryMap(imgUser);
        const templateMap = getBinaryMap(imgTemplate, true);
        const size = 100;

        let totalUserPixels = 0;
        for (let i = 0; i < userMap.length; i++) {
          if (userMap[i] === 1) totalUserPixels++;
        }
        if (totalUserPixels < 50) {
          resolve(false);
          return;
        }

        const distUserToTemplate = computeDistanceMap(templateMap, size);
        let totalUser = 0, goodUser = 0;
        for (let i = 0; i < userMap.length; i++) {
          if (userMap[i] === 1) {
            totalUser++;
            if (distUserToTemplate[i] <= 8) goodUser++;
          }
        }

        const distTemplateToUser = computeDistanceMap(userMap, size);
        let totalTemplate = 0, coveredTemplate = 0;
        for (let i = 0; i < templateMap.length; i++) {
          if (templateMap[i] === 1) {
            totalTemplate++;
            if (distTemplateToUser[i] <= 8) coveredTemplate++;
          }
        }

        const accuracy = goodUser / (totalUser || 1);
        const coverage = coveredTemplate / (totalTemplate || 1);
        resolve(accuracy > 0.7 && coverage > 0.6);
      }
    };

    imgUser.onload = check;
    imgTemplate.onload = check;
    imgUser.src = userImageDataURL;
    const blob = new Blob([templateSvgString], { type: "image/svg+xml" });
    imgTemplate.src = URL.createObjectURL(blob);
  });
};

export default compareImages;