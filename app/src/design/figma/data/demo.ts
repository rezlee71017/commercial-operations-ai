import type { MerchantProduct, Proposal, Rules, Run, RunStatus, RuleCheck, PublicProduct } from "../types"

export const photo = (id: string, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
export const heroImage = photo("photo-1546435770-a3e426bf472b", 1200)
export const categories = ["Audio & Sound", "Mobile & Power", "Computing & Workspace", "Smart Home & Security", "Automotive Gadgets", "Travel & Portable Tech", "Creator & Photography"]
type CatalogRow = {
  id: string
  name: string
  brand: string
  category: string
  kind: string
  price: number
  stock: number
  image: string
  specs: Record<string, string>
  strengths: string[]
  limitation: string
  compatible?: string[]
}
const rows: CatalogRow[] = [
  { id: "a1", name: "QuietForm H1", brand: "SONORA", category: categories[0], kind: "Headphones", price: 12900, stock: 24, image: "photo-1546435770-a3e426bf472b", specs: { "Noise cancellation": "Hybrid ANC", "Battery life": "40 hours", Connectivity: "Bluetooth 5.3 · USB-C", Weight: "250 g", Microphone: "Dual beamforming", "Multipoint": "2 devices" }, strengths: ["Hybrid ANC for focus", "Two-device multipoint", "Within a $150 budget"], limitation: "No 3.5 mm wired input", compatible: ["m1", "t1"] },
  { id: "a2", name: "Studio Wireless 2", brand: "NORD", category: categories[0], kind: "Headphones", price: 8900, stock: 18, image: "photo-1505740420928-5e560c06d30e", specs: { "Noise cancellation": "Passive isolation", "Battery life": "50 hours", Connectivity: "Bluetooth 5.2 · 3.5 mm", Weight: "235 g", Microphone: "Single microphone", "Multipoint": "Not supported" }, strengths: ["Lowest headphone price", "50-hour demo battery", "Wired input available"], limitation: "No active noise cancellation", compatible: ["m1", "t1"] },
  { id: "a3", name: "Space One Pro", brand: "AERIS", category: categories[0], kind: "Headphones", price: 19900, stock: 0, image: "photo-1583394838336-acd977736f90", specs: { "Noise cancellation": "Adaptive ANC", "Battery life": "60 hours", Connectivity: "Bluetooth 5.3 · 3.5 mm", Weight: "275 g", Microphone: "4-microphone array", "Multipoint": "2 devices" }, strengths: ["Adaptive ANC", "60-hour demo battery"], limitation: "Out of stock; above $150", compatible: ["m1"] },
  { id: "a4", name: "Pocket Buds", brand: "SONORA", category: categories[0], kind: "Earbuds", price: 6900, stock: 31, image: "photo-1606220945770-b5b6c2c55bf1", specs: { "Noise cancellation": "ANC", "Battery life": "7 hours · 28 with case", Connectivity: "Bluetooth 5.3", Weight: "5 g per bud", Protection: "IPX4" }, strengths: ["Compact format", "Splash-resistant demo design"], limitation: "Shorter continuous battery than headphones" },
  { id: "m1", name: "Nano 65 GaN", brand: "VOLT", category: categories[1], kind: "Chargers", price: 3900, stock: 26, image: "photo-1601972599720-36938d4ecd31", specs: { Output: "65 W", Ports: "2 USB-C · 1 USB-A", Protocol: "USB PD 3.0", Input: "100–240 V" }, strengths: ["Three charging ports", "USB PD support"], limitation: "65 W shared across ports", compatible: ["a1", "a2", "a3", "m2", "m3", "t1", "c2"] },
  { id: "m2", name: "Reserve 20K", brand: "NORD", category: categories[1], kind: "Power banks", price: 5900, stock: 4, image: "photo-1609592424825-5c89b467a05b", specs: { Capacity: "20,000 mAh", Output: "30 W USB-C", Ports: "1 USB-C · 1 USB-A", Weight: "345 g" }, strengths: ["30 W portable power", "20,000 mAh demo capacity"], limitation: "345 g adds travel weight", compatible: ["m1", "m3", "t1"] },
  { id: "m3", name: "Flex USB-C 100", brand: "VOLT", category: categories[1], kind: "Cables", price: 1500, stock: 40, image: "photo-1555617981-dac3880eac6e", specs: { Power: "100 W", Length: "2 m", Connectors: "USB-C to USB-C", Data: "480 Mbps" }, strengths: ["100 W charging", "2 m reach"], limitation: "Not a video-output cable", compatible: ["m1", "m2", "t1", "c2"] },
  { id: "w1", name: "Type 75", brand: "KEYSTONE", category: categories[2], kind: "Keyboards", price: 9900, stock: 16, image: "photo-1587829741301-dc798b83add3", specs: { Layout: "75% · 84 keys", Connectivity: "USB-C · Bluetooth", Switches: "Tactile mechanical", Platforms: "Windows · macOS" }, strengths: ["Compact mechanical layout", "Windows and macOS"], limitation: "No number pad", compatible: ["w2", "w3"] },
  { id: "w2", name: "Glide Anywhere", brand: "NORD", category: categories[2], kind: "Mice", price: 4900, stock: 22, image: "photo-1527864550417-7fd91fc51a46", specs: { Sensor: "4,000 DPI", Connectivity: "Bluetooth · USB receiver", Buttons: "6", Platforms: "Windows · macOS" }, strengths: ["Two connection modes", "Six configurable buttons"], limitation: "Right-handed shape", compatible: ["w1", "w3"] },
  { id: "w3", name: "Connect 7-in-1", brand: "VOLT", category: categories[2], kind: "USB hubs", price: 6900, stock: 9, image: "photo-1625842268584-8f3296236761", specs: { Ports: "7", Video: "HDMI 4K at 30 Hz", Power: "100 W PD passthrough", Host: "USB-C with DP Alt Mode" }, strengths: ["Seven connection ports", "Power passthrough"], limitation: "Video requires host DP Alt Mode", compatible: ["w1", "w2"] },
  { id: "s1", name: "Home Eye Mini", brand: "HAVEN", category: categories[3], kind: "Smart cameras", price: 4900, stock: 13, image: "photo-1558002038-1055907df827", specs: { Resolution: "2K", Network: "2.4 GHz Wi-Fi", Storage: "microSD · optional cloud", Power: "USB 5 V" }, strengths: ["Local microSD option", "2K demo video"], limitation: "Indoor use; no 5 GHz Wi-Fi", compatible: ["s2", "s3"] },
  { id: "s2", name: "Matter Plug", brand: "HAVEN", category: categories[3], kind: "Smart plugs", price: 1900, stock: 36, image: "photo-1558618666-fcd25c85cd64", specs: { Protocol: "Matter over Wi-Fi", Rating: "15 A", Network: "2.4 GHz Wi-Fi", Hub: "Not required" }, strengths: ["Matter support", "No proprietary hub"], limitation: "Indoor US socket only", compatible: ["s1", "s3"] },
  { id: "s3", name: "Ambient Light Bar", brand: "LUMA", category: categories[3], kind: "Smart lighting", price: 5900, stock: 8, image: "photo-1550745165-9bc0b252726f", specs: { Light: "RGB · tunable white", Protocol: "Wi-Fi", Power: "USB-C 10 W", Length: "40 cm" }, strengths: ["Tunable white light", "USB-C powered"], limitation: "Matter support not recorded", compatible: ["s1", "s2"] },
  { id: "v1", name: "Road View 2K", brand: "ROVE", category: categories[4], kind: "Dash cameras", price: 11900, stock: 7, image: "photo-1549317661-bd32c8ce0db2", specs: { Resolution: "2K at 30 fps", View: "140°", Storage: "microSD up to 256 GB", Power: "12 V adapter" }, strengths: ["Loop recording", "Wide 140° demo view"], limitation: "Memory card sold separately" },
  { id: "v2", name: "Mag Road Mount", brand: "VOLT", category: categories[4], kind: "Car mounts", price: 2900, stock: 19, image: "photo-1512499617640-c74ae3a79d37", specs: { Mount: "Air vent", Attachment: "Magnetic", Charging: "None", Requirement: "Magnetic case or ring" }, strengths: ["Tool-free vent attachment"], limitation: "Requires magnetic case; no charging" },
  { id: "t1", name: "World Adapter 65", brand: "ROAM", category: categories[5], kind: "Travel chargers", price: 5900, stock: 14, image: "photo-1473445730015-841f29a9490b", specs: { Regions: "EU · UK · US · AU", Output: "65 W USB-C", Input: "100–240 V", Conversion: "No voltage conversion" }, strengths: ["Four plug regions", "65 W USB-C output"], limitation: "Not a voltage converter", compatible: ["m1", "m2", "m3", "a1", "a2"] },
  { id: "t2", name: "Mobile Wi-Fi Go", brand: "ROAM", category: categories[5], kind: "Portable routers", price: 7900, stock: 3, image: "photo-1544197150-b99a580bb7a8", specs: { Network: "4G LTE", WiFi: "Wi-Fi 5", Battery: "3,000 mAh", SIM: "Nano-SIM required" }, strengths: ["Portable Wi-Fi network"], limitation: "Data plan not included" },
  { id: "c1", name: "Creator Mic USB", brand: "SONORA", category: categories[6], kind: "Microphones", price: 7900, stock: 17, image: "photo-1590602847861-f357a9332bbc", specs: { Pattern: "Cardioid", Connection: "USB-C", Audio: "24-bit / 48 kHz", Monitoring: "3.5 mm headphone out" }, strengths: ["Direct headphone monitoring", "USB-C connection"], limitation: "No XLR output", compatible: ["c2", "c3"] },
  { id: "c2", name: "Pocket Light", brand: "LUMA", category: categories[6], kind: "Video lights", price: 3900, stock: 23, image: "photo-1502982720700-bfff97f2ecac", specs: { Temperature: "2,700–6,500 K", Mount: "1/4 inch", Battery: "2,000 mAh", Charging: "USB-C" }, strengths: ["Adjustable color temperature"], limitation: "No weather sealing recorded", compatible: ["c1", "c3", "m1", "m3"] },
  { id: "c3", name: "Desk Tripod", brand: "ROAM", category: categories[6], kind: "Tripods", price: 2900, stock: 30, image: "photo-1516035069371-29a1b244cc32", specs: { Height: "15–30 cm", Mount: "1/4 inch", Payload: "1.5 kg", Weight: "320 g" }, strengths: ["Compact desk footprint"], limitation: "Not a full-height tripod", compatible: ["c1", "c2"] },
]
// Expanded synthetic catalog for the interactive prototype. Names, prices, stock and specs are illustrative demo data.
const expansion: CatalogRow[] = [
  ...[
    ["Pulse Arc Pro", "SONORA", "Headphones", 15900, "photo-1505740420928-5e560c06d30e"], ["Airloop S", "NORD", "Earbuds", 7900, "photo-1606220945770-b5b6c2c55bf1"], ["Studio Monitor 4", "AERIS", "Speakers", 12900, "photo-1608043152269-423dbba4e7e1"], ["Wave Mini", "SONORA", "Speakers", 5900, "photo-1608043152269-423dbba4e7e1"], ["Talk USB C", "SONORA", "Microphones", 4900, "photo-1590602847861-f357a9332bbc"], ["QuietForm Lite", "AERIS", "Headphones", 9900, "photo-1546435770-a3e426bf472b"], ["Bass Dock", "NORD", "Speakers", 8900, "photo-1608043152269-423dbba4e7e1"],
  ].map((r, i) => ({ id:`ex-a${i+1}`, name:r[0], brand:r[1], category:categories[0], kind:r[2], price:r[3], stock:[18,32,9,27,14,6,21][i], image:r[4], specs:{ Connectivity:"Bluetooth 5.3 · USB-C", Battery:"Up to 36 hours", Finish:"Graphite", Warranty:"12 months" }, strengths:["Everyday listening", "Compact modern design"], limitation:"Illustrative demo specification" } as CatalogRow)),
  ...[
    ["ChargeDock 3", "VOLT", "Chargers", 4900, "photo-1601972599720-36938d4ecd31"], ["PowerCore Air", "NORD", "Power banks", 6900, "photo-1609592424825-5c89b467a05b"], ["Flex Cable 2m", "VOLT", "Cables", 1200, "photo-1555617981-dac3880eac6e"], ["MagSafe Stand", "VOLT", "Wireless chargers", 3900, "photo-1586953208448-b95a79798f07"], ["Nano Plug 30", "ROAM", "Travel chargers", 2900, "photo-1473445730015-841f29a9490b"], ["Power Brick 100", "VOLT", "Chargers", 7900, "photo-1601972599720-36938d4ecd31"], ["Cable Kit Studio", "NORD", "Cables", 2500, "photo-1555617981-dac3880eac6e"],
  ].map((r, i) => ({ id:`ex-m${i+1}`, name:r[0], brand:r[1], category:categories[1], kind:r[2], price:r[3], stock:[42,11,58,17,23,8,34][i], image:r[4], specs:{ Output:"Up to 100 W", Ports:"USB-C · USB-A", Material:"Reinforced polymer", Warranty:"12 months" }, strengths:["Flexible everyday charging", "Travel-ready format"], limitation:"Illustrative demo specification" } as CatalogRow)),
  ...[
    ["Studio 27 Display", "AERIS", "Monitors", 24900, "photo-1527443224154-c4a3942d3acf"], ["Type 68 Compact", "KEYSTONE", "Keyboards", 7900, "photo-1587829741301-dc798b83add3"], ["Track Pro", "NORD", "Mice", 5900, "photo-1527864550417-7fd91fc51a46"], ["Desk Hub 10", "VOLT", "USB hubs", 8900, "photo-1625842268584-8f3296236761"], ["Laptop Stand Air", "KEYSTONE", "Laptop stands", 3900, "photo-1527864550417-7fd91fc51a46"], ["Worklight One", "LUMA", "Desk lighting", 4500, "photo-1507473885765-e6ed057f782c"], ["Desk Mat Form", "KEYSTONE", "Desk accessories", 1900, "photo-1498050108023-c5249f4df085"],
  ].map((r, i) => ({ id:`ex-w${i+1}`, name:r[0], brand:r[1], category:categories[2], kind:r[2], price:r[3], stock:[12,25,19,7,31,16,45][i], image:r[4], specs:{ Compatibility:"Windows · macOS", Material:"Aluminium · composite", Connectivity:"USB-C · Bluetooth", Warranty:"12 months" }, strengths:["Designed for productive setups", "Minimal desk footprint"], limitation:"Illustrative demo specification" } as CatalogRow)),
  ...[
    ["Entry Sensor 2", "HAVEN", "Smart sensors", 2900, "photo-1558002038-1055907df827"], ["Halo Indoor Cam", "HAVEN", "Smart cameras", 6900, "photo-1558002038-1055907df827"], ["Scene Switch", "LUMA", "Smart switches", 2500, "photo-1558618666-fcd25c85cd64"], ["Glow Strip 3m", "LUMA", "Smart lighting", 3900, "photo-1550745165-9bc0b252726f"], ["Doorbell View", "HAVEN", "Video doorbells", 9900, "photo-1558002038-1055907df827"], ["Climate Node", "HAVEN", "Climate sensors", 4900, "photo-1558618666-fcd25c85cd64"],
  ].map((r, i) => ({ id:`ex-s${i+1}`, name:r[0], brand:r[1], category:categories[3], kind:r[2], price:r[3], stock:[20,8,36,14,5,11][i], image:r[4], specs:{ Protocol:"Matter · Wi-Fi", Network:"2.4 GHz", Setup:"App guided", Warranty:"12 months" }, strengths:["Connected-home control", "Simple installation"], limitation:"Illustrative demo specification" } as CatalogRow)),
  ...[
    ["RoadCam Vision", "ROVE", "Dash cameras", 14900, "photo-1549317661-bd32c8ce0db2"], ["Magnetic Dash Mount", "VOLT", "Car mounts", 3500, "photo-1512499617640-c74ae3a79d37"], ["DriveLink Wireless", "ROVE", "Car adapters", 5900, "photo-1549317661-bd32c8ce0db2"], ["Park Sensor Kit", "ROVE", "Parking sensors", 7900, "photo-1558618666-fcd25c85cd64"], ["Road Charger Duo", "VOLT", "Car chargers", 2900, "photo-1601972599720-36938d4ecd31"], ["Cabin Audio Mini", "SONORA", "Car audio", 8900, "photo-1608043152269-423dbba4e7e1"],
  ].map((r, i) => ({ id:`ex-v${i+1}`, name:r[0], brand:r[1], category:categories[4], kind:r[2], price:r[3], stock:[9,22,13,4,29,17][i], image:r[4], specs:{ Fit:"Universal fit", Power:"USB-C · 12 V", Installation:"Tool-free where applicable", Warranty:"12 months" }, strengths:["Useful in-car upgrade", "Compact form factor"], limitation:"Check vehicle fit before purchase" } as CatalogRow)),
  ...[
    ["Roam Wi-Fi 5G", "ROAM", "Portable routers", 11900, "photo-1544197150-b99a580bb7a8"], ["Transit Power 20", "NORD", "Power banks", 6900, "photo-1609592424825-5c89b467a05b"], ["World Plug Kit", "ROAM", "Travel adapters", 3900, "photo-1473445730015-841f29a9490b"], ["PackLight Hub", "VOLT", "Travel hubs", 4900, "photo-1625842268584-8f3296236761"], ["Fold Stand Go", "KEYSTONE", "Travel stands", 2900, "photo-1527864550417-7fd91fc51a46"], ["TrackTag Mini", "ROAM", "Trackers", 2500, "photo-1544197150-b99a580bb7a8"],
  ].map((r, i) => ({ id:`ex-t${i+1}`, name:r[0], brand:r[1], category:categories[5], kind:r[2], price:r[3], stock:[7,24,41,12,18,33][i], image:r[4], specs:{ Weight:"Under 400 g", Connectivity:"USB-C · Bluetooth", Travel:"Carry-on friendly", Warranty:"12 months" }, strengths:["Built for mobility", "Compact travel companion"], limitation:"Illustrative demo specification" } as CatalogRow)),
  ...[
    ["Creator Cam 4K", "LUMA", "Cameras", 29900, "photo-1502982720700-bfff97f2ecac"], ["Beam Key Light", "LUMA", "Video lights", 8900, "photo-1502982720700-bfff97f2ecac"], ["VoiceCast Pro", "SONORA", "Microphones", 11900, "photo-1590602847861-f357a9332bbc"], ["Carbon Tripod", "ROAM", "Tripods", 6900, "photo-1516035069371-29a1b244cc32"], ["Creator Capture Hub", "VOLT", "Capture cards", 9900, "photo-1625842268584-8f3296236761"], ["Pocket Reflector", "LUMA", "Photography accessories", 1900, "photo-1502982720700-bfff97f2ecac"],
  ].map((r, i) => ({ id:`ex-c${i+1}`, name:r[0], brand:r[1], category:categories[6], kind:r[2], price:r[3], stock:[5,13,10,18,7,32][i], image:r[4], specs:{ Resolution:"4K-ready workflow", Mount:"Standard 1/4 inch", Connectivity:"USB-C", Warranty:"12 months" }, strengths:["Creator-focused workflow", "Flexible content setup"], limitation:"Illustrative demo specification" } as CatalogRow)),
]
export const products: MerchantProduct[] = [...rows, ...expansion].map(r => ({
  id: r.id, name: r.name, brand: r.brand, category: r.category, kind: r.kind,
  priceCents: r.price, costCents: Math.round(r.price * 0.56), stock: r.stock,
  imageUrl: photo(r.image), specs: r.specs, strengths: r.strengths, limitation: r.limitation,
  compatibleWith: r.compatible ?? [], complementaryWith: r.compatible ?? [], isSynthetic: true,
}))
export const featured = products.slice(0, 8)
export const prompts = ["Headphones for work under $150", "Build my remote-work setup", "A portable creator kit"]
export const defaultRules: Rules = { minMarginPct: 20, maxDiscountPct: 15 }
export const bundle: Proposal = {
  id: "desk", name: "The focused workspace",
  items: [{ productId: "w1", qty: 1 }, { productId: "w2", qty: 1 }, { productId: "w3", qty: 1 }],
  discountPct: 10, explanation: "A compact keyboard, a wireless mouse, and a USB-C hub. All three relationships are recorded in the demo compatibility graph; the hub still requires a suitable USB-C host.",
}
export const creatorBundle: Proposal = {
  id: "creator", name: "The creator starter kit",
  items: [{ productId: "c1", qty: 1 }, { productId: "c2", qty: 1 }, { productId: "c3", qty: 1 }],
  discountPct: 10, explanation: "USB audio, adjustable lighting, and a desk tripod. Demo relationships are recorded; check the microphone adapter before physical mounting.",
}
export const money = (cents: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100)
export function compatibility(a: PublicProduct, b: PublicProduct) {
  return a.compatibleWith.includes(b.id) || b.compatibleWith.includes(a.id)
}
export function checkProposal(p: Proposal, rules: Rules, catalog = products): RuleCheck[] {
  const items = p.items.map(i => ({ product: catalog.find(p => p.id === i.productId), qty: i.qty }))
  const revenue = Math.round(items.reduce((s, i) => s + (i.product?.priceCents ?? 0) * i.qty, 0) * (1 - p.discountPct / 100))
  const cost = items.reduce((s, i) => s + (i.product?.costCents ?? 0) * i.qty, 0)
  const margin = revenue ? (revenue - cost) / revenue * 100 : 0
  const primary = items[0]?.product
  return [
    { rule: "Margin", passed: revenue > 0 && margin >= rules.minMarginPct, detail: `${margin.toFixed(1)}% margin · ${rules.minMarginPct}% minimum` },
    { rule: "Discount", passed: p.discountPct >= 0 && p.discountPct <= rules.maxDiscountPct, detail: `${p.discountPct}% discount · ${rules.maxDiscountPct}% maximum` },
    { rule: "Stock", passed: items.length >= 2 && items.every(i => i.product && i.qty > 0 && Number.isInteger(i.qty) && i.product.stock >= i.qty), detail: "At least two products; sufficient stock for each quantity" },
    { rule: "Compatibility", passed: !!primary && items.slice(1).every(i => i.product && compatibility(primary, i.product)), detail: "Every addition must have a recorded relationship with the primary item" },
  ]
}
const statuses: RunStatus[] = ["awaiting_approval", "rejected_by_policy", "failed", "needs_input", "rejected"]
export const initialRuns: Run[] = statuses.map((status, i) => {
  const proposal = { ...(i % 2 ? creatorBundle : bundle), discountPct: status === "rejected_by_policy" ? 30 : 10 }
  const at = new Date(Date.now() - i * 3600000).toISOString()
  return { id: `RZ-${1048 - i}`, request: ["Create a remote-work bundle", "Creator kit at 30% off", "Prepare workspace essentials", "Help with bundles", "A compact creator kit"][i], status, proposal, checks: checkProposal(proposal, defaultRules), createdAt: at, events: [{ step: "Catalog evaluation", status: status === "failed" ? "failed" : "ok", message: status === "failed" ? "Simulated provider failure" : "Evaluated demo inventory and policy", at }] }
})
export const demoSalesTrend = [
  { day: "Mon", revenue: 1240, orders: 12 }, { day: "Tue", revenue: 1680, orders: 16 },
  { day: "Wed", revenue: 1420, orders: 14 }, { day: "Thu", revenue: 2110, orders: 21 },
  { day: "Fri", revenue: 1840, orders: 18 }, { day: "Sat", revenue: 2580, orders: 25 },
  { day: "Sun", revenue: 2260, orders: 22 },
]
export const orders = [
  { id: "D-01", productId: "a1", qty: 2 },
  { id: "D-02", productId: "w1", qty: 1 },
  { id: "D-03", productId: "m1", qty: 3 },
  { id: "D-04", productId: "a2", qty: 1 },
]
export function simulateAssistant(request: string, catalog: PublicProduct[] = products) {
  const q = request.toLowerCase()
  const amount = q.match(/(?:under|budget|below|max|to|less than|up to|\$)\s*\$?(\d+)/)
  const patterns: [RegExp, string][] = [
    [/earbud|in-ear/, "Earbuds"], [/headphone|noise cancell|anc/, "Headphones"], [/speaker|soundbar/, "Speakers"],
    [/keyboard/, "Keyboards"], [/mouse|mice/, "Mice"], [/monitor|display|screen/, "Monitors"], [/usb.?hub|hub/, "USB hubs"],
    [/power bank|powerbank/, "Power banks"], [/charger|charging brick/, "Chargers"], [/cable/, "Cables"],
    [/smart camera|security camera|indoor cam/, "Smart cameras"], [/smart plug/, "Smart plugs"], [/dash.?cam|dash camera/, "Dash cameras"],
    [/microphone|mic/, "Microphones"], [/tripod/, "Tripods"], [/video light|key light/, "Video lights"], [/router|wi-?fi/, "Portable routers"],
  ]
  const kind = patterns.find(([pattern]) => pattern.test(q))?.[1] ?? ""
  const category = /desk|work.*setup|remote|laptop|monitor/.test(q) ? categories[2]
    : /creat|photo|video|stream/.test(q) ? categories[6]
    : /travel|portable|roam/.test(q) ? categories[5]
    : /car|drive|vehicle/.test(q) ? categories[4]
    : /smart home|home security|matter/.test(q) ? categories[3] : ""
  const candidates = catalog.filter(p => (!kind || p.kind === kind) && (!category || p.category === category))
  const budget = amount ? Number(amount[1]) * 100 : undefined
  const available = candidates.filter(p => p.stock > 0)
  const results = available.filter(p => !budget || p.priceCents <= budget).sort((a, b) => {
    const score = (p: PublicProduct) => {
      let value = 0
      if (/noise|study|focus|work|travel|anc/.test(q) && p.specs["Noise cancellation"]?.includes("ANC")) value += 3
      if (/battery|long lasting|long battery/.test(q) && /hours/.test(p.specs["Battery life"] ?? p.specs.Battery ?? "")) value += 2
      if (/lightweight|light weight/.test(q) && /g/.test(p.specs.Weight ?? "")) value += 1
      if (/wireless|bluetooth/.test(q) && /bluetooth/i.test(Object.values(p.specs).join(" "))) value += 1
      return value
    }
    return score(b) - score(a) || a.priceCents - b.priceCents
  }).slice(0, 8)
  const alternatives = available.filter(p => !results.some(r => r.id === p.id)).sort((a, b) => a.priceCents - b.priceCents).slice(0, 4)
  return { clarification: !kind && !category && !amount, results, alternatives, budget, kind, category }
}
