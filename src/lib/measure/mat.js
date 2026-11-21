import{AR}from"../vendor/aruco/aruco";export const DICTIONARY="ARUCO_MIP_36h12",MAT_SIZE=180,MARKER_SIZE=24,MARKER_IDS=[10,11,12,13],RULER_MM=100;const origins={10:{x:0,y:0},11:{x:MAT_SIZE-MARKER_SIZE,y:0},12:{x:MAT_SIZE-MARKER_SIZE,y:MAT_SIZE-MARKER_SIZE},13:{x:0,y:MAT_SIZE-MARKER_SIZE}};export function markerCornersMm(id){const o=origins[id];if(!o)return null;const s=MARKER_SIZE;return[{x:o.x,y:o.y},{x:o.x+s,y:o.y},{x:o.x+s,y:o.y+s},{x:o.x,y:o.y+s}]}export function ignoredRegionsMm(margin=3){return Object.values(origins).map(o=>({x0:o.x-margin,y0:o.y-margin,x1:o.x+MARKER_SIZE+margin,y1:o.y+MARKER_SIZE+margin}))}let dict=null;function dictionary(){return dict||(dict=new AR.Dictionary(DICTIONARY)),dict}function markerSvg(id){const d=dictionary(),code=d.codeList[id],bits=d.markSize-2,cell=MARKER_SIZE/(bits+2),o=origins[id];let s=`<rect x="${o.x}" y="${o.y}" width="${MARKER_SIZE}" height="${MARKER_SIZE}" fill="#000"/>`;for(let y=0;y<bits;y++)for(let x=0;x<bits;x++)code[y*bits+x]==="1"&&(s+=`<rect x="${o.x+(x+1)*cell}" y="${o.y+(y+1)*cell}" width="${cell+.01}" height="${cell+.01}" fill="#fff"/>`);return s}export function matSvg(){const pageW=MAT_SIZE+20,pageH=MAT_SIZE+50,ox=10,oy=10;let ruler="";for(let i=0;i<=RULER_MM;i++){const len=i%10===0?5:i%5===0?3.5:2;ruler+=`<line x1="${i}" y1="0" x2="${i}" y2="${len}" stroke="#000" stroke-width="0.15"/>`,i%10===0&&(ruler+=`<text x="${i}" y="8.5" font-size="2.6" text-anchor="middle" font-family="sans-serif">${i/10}</text>`)}return`<svg xmlns="http://www.w3.org/2000/svg" width="${pageW}mm" height="${pageH}mm" viewBox="0 0 ${pageW} ${pageH}">
  <rect width="${pageW}" height="${pageH}" fill="#fff"/>
  <g transform="translate(${ox} ${oy})">
    ${MARKER_IDS.map(markerSvg).join("")}
    <rect x="0" y="0" width="${MAT_SIZE}" height="${MAT_SIZE}" fill="none" stroke="#e5e5e5" stroke-width="0.2" stroke-dasharray="1 2"/>
  </g>
  <g transform="translate(${ox} ${oy+MAT_SIZE+8})">
    <line x1="0" y1="0" x2="${RULER_MM}" y2="0" stroke="#000" stroke-width="0.3"/>
    ${ruler}
    <text x="${RULER_MM+4}" y="4" font-size="3" font-family="sans-serif">← print check: this line must be exactly 10 cm</text>
    <text x="0" y="17" font-size="3" font-family="sans-serif">Jewel Lister calibration mat \xB7 print at 100% (no “fit to page”) \xB7 place jewelry inside the markers</text>
  </g>
</svg>`}
