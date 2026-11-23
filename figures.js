/* 生活中的科學　客語詞彙篇｜詞彙卡上的示意圖
   ─ 每一張圖是一段 SVG，直接畫在網頁上：沒有底色、沒有外框。
   ─ 在 vocab-data.js 的詞加上 figure: "圖的代號"（例如 figure: "kmno4"），詞彙卡上就會出現這張圖。
   ─ 動畫寫在 styles.css（.fig 開頭的規則）；電腦若設定「減少動態效果」，會直接顯示畫好的樣子，不轉動。 */
window.VOCAB_FIGURES = {
  /* 高錳酸鉀 KMnO₄ 的結構式（單鍵畫法）：比照課本的結構式，元素符號與鍵線都是白色，不上色。
     中間是錳，四周四個氧，其中一個氧帶負電，旁邊是鉀離子。整個式子以錳為中心慢慢轉動，符號保持正向。 */
  kmno4: {
    label: "高錳酸鉀的結構式：錳原子與四個氧原子以單鍵相連，旁邊是鉀離子",
    svg: `<svg class="fig fig-kmno4" viewBox="-140 -140 280 280" role="img">
    <g class="fig-spin">
      <line class="fig-bond b1" x1="0" y1="-30" x2="0" y2="-58"/>
      <line class="fig-bond b2" x1="33" y1="0" x2="58" y2="0"/>
      <line class="fig-bond b3" x1="0" y1="30" x2="0" y2="58"/>
      <line class="fig-bond b4" x1="-33" y1="0" x2="-58" y2="0"/>
      <line class="fig-ionic" x1="-95" y1="0" x2="-103" y2="0"/>
      <g transform="translate(0,-78)"><g class="fig-upright"><g class="fig-atom fig-o a1"><text>O</text></g></g></g>
      <g transform="translate(78,0)"><g class="fig-upright"><g class="fig-atom fig-o a2"><text>O</text></g></g></g>
      <g transform="translate(0,78)"><g class="fig-upright"><g class="fig-atom fig-o a3"><text>O</text></g></g></g>
      <g transform="translate(-78,0)"><g class="fig-upright"><g class="fig-atom fig-o a4"><text>O</text><text class="fig-charge" x="17" y="-15">−</text></g></g></g>
      <g transform="translate(-120,0)"><g class="fig-upright"><g class="fig-atom fig-k"><text>K</text><text class="fig-charge" x="15" y="-15">+</text></g></g></g>
      <g transform="translate(0,0)"><g class="fig-upright"><g class="fig-atom fig-mn"><text>Mn</text></g></g></g>
    </g>
</svg>`
  }
};
