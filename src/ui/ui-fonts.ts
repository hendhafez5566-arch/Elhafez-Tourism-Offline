export const UIDocument: any = document;

// v32.4.85 — portable Arabic font catalog. Remote font CSS is loaded only for the selected family; system default stays dependency-free.
export const SystemFontCatalog: any={
 default:{label:'الافتراضي',stack:'Tahoma,"Noto Sans Arabic","Segoe UI",Arial,sans-serif',href:''},
 cairo:{label:'Cairo',stack:'"Cairo",Tahoma,"Noto Sans Arabic",Arial,sans-serif',href:'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap'},
 tajawal:{label:'Tajawal',stack:'"Tajawal",Tahoma,"Noto Sans Arabic",Arial,sans-serif',href:'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap'},
 noto:{label:'Noto Sans Arabic',stack:'"Noto Sans Arabic",Tahoma,Arial,sans-serif',href:'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700;800&display=swap'},
 plex:{label:'IBM Plex Arabic',stack:'"IBM Plex Sans Arabic","Noto Sans Arabic",Tahoma,Arial,sans-serif',href:'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700&display=swap'},
 kufi:{label:'Noto Kufi Arabic',stack:'"Noto Kufi Arabic","Noto Sans Arabic",Tahoma,Arial,sans-serif',href:'https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;500;600;700;800&display=swap'}
};

export const systemFontEntry=value=>SystemFontCatalog[value]||SystemFontCatalog.default;

export const ensureSystemFontAsset=value=>{const entry=systemFontEntry(value),id='erpSystemFontCss';let link=UIDocument.getElementById(id);if(!entry.href){link?.remove();return entry}if(!link){link=UIDocument.createElement('link');link.id=id;link.rel='stylesheet';UIDocument.head.appendChild(link)}if(link.getAttribute('href')!==entry.href)link.setAttribute('href',entry.href);return entry};
