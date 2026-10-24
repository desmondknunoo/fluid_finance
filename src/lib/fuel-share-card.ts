import { FLUID_DESIGN_PRESETS as PRESETS } from "@/lib/fluid-design-presets";
import { drawStudioFooter } from "@/lib/weekly-trends-share-card";
import { averageFuelPrice, formatFuelChange, formatFuelDate, formatFuelPrice, fuelReportPages, fuelRowChange, type FuelReport, type FuelPriceRow } from "@/lib/fuel-prices";

function loadLogo(url: string, name: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const timeout = window.setTimeout(() => { img.onload = null; img.onerror = null; reject(new Error(`The logo for ${name} could not load. Replace it in the editor before sharing.`)); }, 15000);
        img.onload = () => { clearTimeout(timeout); resolve(img); };
        img.onerror = () => { clearTimeout(timeout); reject(new Error(`The logo for ${name} could not load. Replace it in the editor before sharing.`)); };
        img.src = url;
    });
}

/** Load every logo before generating any pages. No partial report can be shared. */
export async function renderFuelCards(report: FuelReport, previous: FuelReport | null = null): Promise<Blob[]> {
    const pages = fuelReportPages(report.prices);
    await document.fonts.ready;
    const fonts=await Promise.all([400,500,700,800].map((weight)=>new FontFace("FluidPumpBody",`url("/fonts/Poppins-${({400:"Regular",500:"Medium",700:"Bold",800:"ExtraBold"} as Record<number,string>)[weight]}.ttf")`,{weight:String(weight)}).load()));
    fonts.forEach(font=>document.fonts.add(font));
    const logos = new Map<string, HTMLImageElement>();
    const brand = await loadLogo("/logo/studio-approved.png", "Fluid Finance");
    const background = await loadLogo("/studio/backgrounds/pump-generated.png", "pump background");
    for (let i = 0; i < report.prices.length; i += 10) {
        await Promise.all(report.prices.slice(i, i + 10).map(async row => {
            logos.set(row.logo_url!, await loadLogo(row.logo_url!, row.name));
        }));
    }
    const blobs: Blob[] = [];
    for (let index=0;index<pages.length;index++) blobs.push(await renderPage(report, previous, pages[index], logos, brand, background, index+1, pages.length));
    return blobs;
}

async function renderPage(report: FuelReport, previous: FuelReport | null, rows: FuelPriceRow[], logos: Map<string, HTMLImageElement>, logo: HTMLImageElement, background: HTMLImageElement, page: number, pageCount: number): Promise<Blob> {
    const canvas=document.createElement("canvas");canvas.width=1080;canvas.height=1350;
    const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Your browser cannot generate this image.");
    const body="FluidPumpBody", footerY=1198;
    ctx.fillStyle=PRESETS.backgroundBlue.base;ctx.fillRect(0,0,1080,1350);
    const scale=Math.max(1080/background.naturalWidth,footerY/background.naturalHeight),w=background.naturalWidth*scale,h=background.naturalHeight*scale;
    ctx.drawImage(background,(1080-w)/2,(footerY-h)/2,w,h);
    const overlay=ctx.createLinearGradient(0,0,1080,footerY);overlay.addColorStop(0,"#020e25e0");overlay.addColorStop(0.55,"#06245566");overlay.addColorStop(1,"#020e2580");ctx.fillStyle=overlay;ctx.fillRect(0,0,1080,footerY);
    const corner=ctx.createLinearGradient(32,20,340,190);corner.addColorStop(0,"#062455b0");corner.addColorStop(1,"#020e2500");ctx.fillStyle=corner;ctx.fillRect(32,20,308,170);
    ctx.drawImage(logo,798,862,1704,826,64,44,230,230*826/1704);
    // Blend the averages into a dark corner without a visible panel edge.
    const averageWash=ctx.createRadialGradient(1016,60,24,1016,60,365);
    averageWash.addColorStop(0,"#020e25f5");averageWash.addColorStop(0.45,"#020e25d9");averageWash.addColorStop(0.78,"#06245555");averageWash.addColorStop(1,"#020e2500");
    ctx.fillStyle=averageWash;ctx.fillRect(650,0,430,425);
    ctx.textAlign="right";ctx.fillStyle="#cbd5e1";ctx.font=`500 17px ${body}`;ctx.fillText("AVERAGE · GHS / LITRE",1016,70);
    for(const [index,fuel] of (["petrol","diesel"] as const).entries()){
        const price=averageFuelPrice(report.prices,fuel);ctx.font=`500 21px ${body}`;ctx.fillStyle="#cbd5e1";ctx.fillText(fuel==="petrol"?"Petrol":"Diesel",890,108+index*34);
        ctx.font=`700 25px ${body}`;ctx.fillStyle=fuel==="petrol"?"#67e8f9":"#34d399";ctx.fillText(formatFuelPrice(price),1016,108+index*34);
    }
    ctx.textAlign="left";ctx.letterSpacing="-2px";ctx.font=`800 94px ${body}`;ctx.fillStyle="#ffffff";ctx.fillText("FLUID PUMP",64,242);
    const gradient=ctx.createLinearGradient(64,0,440,0);gradient.addColorStop(0,PRESETS.textBlue.start);gradient.addColorStop(1,PRESETS.textBlue.end);ctx.fillStyle=gradient;ctx.fillText("REPORT",64,330);ctx.letterSpacing="0px";
    const edges=[64,464,609,754,885,1016],headerY=360,headerH=54,top=414,rowH=64,bottom=top+rows.length*rowH;
    ctx.fillStyle="#03172c8c";ctx.beginPath();ctx.roundRect(64,headerY,952,bottom-headerY,18);ctx.fill();
    ctx.save();ctx.beginPath();ctx.roundRect(64,headerY,952,bottom-headerY,18);ctx.clip();
    rows.forEach((_,index)=>{ctx.fillStyle=index%2===0?"#020e2566":"#06245533";ctx.fillRect(64,top+index*rowH,952,rowH);});
    ctx.restore();
    ctx.strokeStyle="#ffffff";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(64,headerY,952,bottom-headerY,18);ctx.stroke();ctx.beginPath();
    for(const x of edges.slice(1,-1)){ctx.moveTo(x,headerY);ctx.lineTo(x,bottom);}for(let n=0;n<rows.length;n++){ctx.moveTo(64,top+n*rowH);ctx.lineTo(1016,top+n*rowH);}ctx.stroke();
    ctx.fillStyle="#ffffff";ctx.textBaseline="middle";ctx.font=`700 17px ${body}`;
    ["Name","Petrol (GHS)","Diesel (GHS)","Petrol %","Diesel %"].forEach((label,n)=>{ctx.fillStyle=n===0?"#ffffff":n%2===1?"#67e8f9":"#34d399";ctx.textAlign=n===0?"left":"center";ctx.fillText(label,n===0?86:(edges[n]+edges[n+1])/2,headerY+headerH/2);});
    rows.forEach((row,index)=>{
        const y=top+index*rowH,center=y+rowH/2,companyLogo=logos.get(row.logo_url!)!;
        ctx.fillStyle="#ffffff";ctx.beginPath();ctx.roundRect(78,y+10,44,44,6);ctx.fill();const scale=Math.min(38/companyLogo.naturalWidth,38/companyLogo.naturalHeight),w=companyLogo.naturalWidth*scale,h=companyLogo.naturalHeight*scale;ctx.drawImage(companyLogo,81+(38-w)/2,y+13+(38-h)/2,w,h);
        ctx.textAlign="left";ctx.fillStyle="#ffffff";let size=24;for(;size>16;size--){ctx.font=`500 ${size}px ${body}`;if(ctx.measureText(row.name).width<=304)break;}ctx.fillText(row.name,140,center);
        ctx.textAlign="center";ctx.font=`700 25px ${body}`;[row.petrol,row.diesel].forEach((price,n)=>{ctx.fillStyle="#ffffff";ctx.fillText(formatFuelPrice(price),(edges[n+1]+edges[n+2])/2,center);});
        const change=fuelRowChange(row,previous);ctx.font=`500 20px ${body}`;[change.petrol,change.diesel].forEach((value,n)=>{ctx.fillStyle=value===null?"#94a3b8":value>0?"#fb7185":value<0?"#34d399":"#94a3b8";ctx.fillText(formatFuelChange(value),(edges[n+3]+edges[n+4])/2,center);});
    });
    ctx.textBaseline="alphabetic";ctx.textAlign="left";ctx.fillStyle="#cbd5e1";ctx.font=`400 18px ${body}`;
    ctx.fillText(previous?`% change vs ${formatFuelDate(previous.report_date)}`:"% change: no earlier report to compare",64,bottom+30);
    if(pageCount>1){ctx.textAlign="right";ctx.fillText(`Page ${page} of ${pageCount}`,1016,bottom+30);}
    ctx.font=`500 22px ${body}`;ctx.fillStyle="#ffffff";ctx.textAlign="left";ctx.fillText("Source: Fluid Finance",64,1146);ctx.textAlign="right";ctx.fillText(formatFuelDate(report.report_date),1016,1146);ctx.textAlign="left";
    drawStudioFooter(ctx,1350);
    return new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error("Could not encode the image.")),"image/png"));
}
