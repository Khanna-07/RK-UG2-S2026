window.addEventListener("scroll", () => {
  requestAnimationFrame(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = Math.min(1, scrollTop / (docHeight || 1));

    // RGB for Royal Blue
    const blue = {
      top: [11, 60, 93],
      mid: [20, 93, 160],
      bot: [30, 79, 122]
    };

    // RGB for Emerald Green
    const green = {
      top: [10, 92, 61],
      mid: [16, 122, 84],
      bot: [12, 86, 66]
    };

    const lerp = (start, end, t) => Math.round(start + (end - start) * t);

    const mix = (c1, c2, t) => 
      `rgb(${lerp(c1[0], c2[0], t)}, ${lerp(c1[1], c2[1], t)}, ${lerp(c1[2], c2[2], t)})`;

    const topColor = mix(blue.top, green.top, scrollPercent);
    const midColor = mix(blue.mid, green.mid, scrollPercent);
    const botColor = mix(blue.bot, green.bot, scrollPercent);

    document.body.style.background = `linear-gradient(180deg, ${topColor} 0%, ${midColor} 50%, ${botColor} 100%)`;
  });
});

// Initialize background color on load
window.dispatchEvent(new Event('scroll'));