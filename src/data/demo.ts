import type { MerchantProduct, Proposal, Rules, Run, RunStatus, RuleCheck, PublicProduct, Compatibility } from "../types"

export const photo = (id: string, width = 900) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`
export const heroImage = photo("photo-1546435770-a3e426bf472b", 1200)

export const categories = [
  "Audio & Sound",
  "Mobile & Power",
  "Computing & Workspace",
  "Smart Home & Security",
  "Automotive Gadgets",
  "Travel & Portable Tech",
  "Creator & Photography",
  "Wearables",
  "Networking & Storage",
]

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
  cost?: number
}

const rows: CatalogRow[] = [
  // ── Audio & Sound (14) ──────────────────────────────────────────────
  { id: "a1", name: "QuietForm H1", brand: "SONORA", category: categories[0], kind: "Headphones", price: 12900, stock: 24, image: "photo-1546435770-a3e426bf472b", specs: { "Noise cancellation": "Hybrid ANC", "Battery life": "40 hours", Connectivity: "Bluetooth 5.3 · USB-C", Weight: "250 g", Microphone: "Dual beamforming", Multipoint: "2 devices" }, strengths: ["Hybrid ANC for focus", "Two-device multipoint", "Within a $150 budget"], limitation: "No 3.5 mm wired input", compatible: ["m1", "t1"] },
  { id: "a2", name: "Studio Wireless 2", brand: "NORD", category: categories[0], kind: "Headphones", price: 8900, stock: 18, image: "photo-1505740420928-5e560c06d30e", specs: { "Noise cancellation": "Passive isolation", "Battery life": "50 hours", Connectivity: "Bluetooth 5.2 · 3.5 mm", Weight: "235 g", Microphone: "Single microphone", Multipoint: "Not supported" }, strengths: ["Lowest headphone price", "50-hour demo battery", "Wired input available"], limitation: "No active noise cancellation", compatible: ["m1", "t1"] },
  { id: "a3", name: "Space One Pro", brand: "AERIS", category: categories[0], kind: "Headphones", price: 19900, stock: 0, image: "photo-1583394838336-acd977736f90", specs: { "Noise cancellation": "Adaptive ANC", "Battery life": "60 hours", Connectivity: "Bluetooth 5.3 · 3.5 mm", Weight: "275 g", Microphone: "4-microphone array", Multipoint: "2 devices" }, strengths: ["Adaptive ANC", "60-hour demo battery"], limitation: "Out of stock; above $150", compatible: ["m1"] },
  { id: "a4", name: "Pocket Buds", brand: "SONORA", category: categories[0], kind: "Earbuds", price: 6900, stock: 31, image: "photo-1606220945770-b5b6c2c55bf1", specs: { "Noise cancellation": "ANC", "Battery life": "7 hours · 28 with case", Connectivity: "Bluetooth 5.3", Weight: "5 g per bud", Protection: "IPX4" }, strengths: ["Compact format", "Splash-resistant demo design"], limitation: "Shorter continuous battery than headphones" },
  { id: "a5", name: "ClearCast Mini", brand: "NORD", category: categories[0], kind: "Earbuds", price: 4900, stock: 42, image: "photo-1590658268037-6bf12165a8df", specs: { "Noise cancellation": "None", "Battery life": "6 hours · 24 with case", Connectivity: "Bluetooth 5.2", Weight: "4.2 g per bud", Protection: "IPX5" }, strengths: ["Lowest earbud price", "IPX5 rating"], limitation: "No active noise cancellation" },
  { id: "a6", name: "Reference Over-Ear", brand: "AERIS", category: categories[0], kind: "Headphones", price: 24900, stock: 7, image: "photo-1484704849700-f032a568e944", specs: { "Noise cancellation": "Hybrid ANC", "Battery life": "45 hours", Connectivity: "Bluetooth 5.3 · 3.5 mm · USB-C", Weight: "290 g", Microphone: "Beamforming array", Multipoint: "2 devices" }, strengths: ["Studio-leaning sound profile", "Wired + wireless"], limitation: "Heavier than average travel headphones" },
  { id: "a7", name: "Commute Buds SE", brand: "SONORA", category: categories[0], kind: "Earbuds", price: 9900, stock: 19, image: "photo-1606220588913-b3aacb4d2f46", specs: { "Noise cancellation": "Hybrid ANC", "Battery life": "8 hours · 32 with case", Connectivity: "Bluetooth 5.3", Weight: "5.5 g per bud", Protection: "IPX4", Multipoint: "2 devices" }, strengths: ["Strong ANC for price", "Multipoint"], limitation: "Case is larger than true wireless minimal designs" },
  { id: "a8", name: "Desk Speaker Duo", brand: "NORD", category: categories[0], kind: "Speakers", price: 11900, stock: 12, image: "photo-1545454675-3531b543be5d", specs: { Power: "2 × 20 W", Connectivity: "Bluetooth 5.0 · 3.5 mm · USB", Drivers: "Full-range + passive radiator", Finish: "Matte black" }, strengths: ["Compact desktop pair", "Multiple inputs"], limitation: "Not battery powered" },
  { id: "a9", name: "Portable Boom 12", brand: "VOLT", category: categories[0], kind: "Speakers", price: 7900, stock: 15, image: "photo-1608043152269-423dbba4e7e1", specs: { Power: "12 W", "Battery life": "12 hours", Connectivity: "Bluetooth 5.1", Protection: "IPX7", Weight: "480 g" }, strengths: ["IPX7 waterproof demo rating", "Long playback"], limitation: "Mono output only" },
  { id: "a10", name: "Studio Monitor Pair", brand: "AERIS", category: categories[0], kind: "Speakers", price: 32900, stock: 4, image: "photo-1558618666-fcd25c85cd64", specs: { Power: "2 × 50 W", Connectivity: "XLR · TRS · RCA", Drivers: "5-inch woofer + silk tweeter", Response: "50 Hz – 20 kHz" }, strengths: ["Near-field monitoring focus", "Balanced inputs"], limitation: "Requires external power and stands" },
  { id: "a11", name: "Neckband Sport", brand: "SONORA", category: categories[0], kind: "Earbuds", price: 4500, stock: 28, image: "photo-1572569511254-d8f925fe2cbb", specs: { "Noise cancellation": "None", "Battery life": "14 hours", Connectivity: "Bluetooth 5.0", Protection: "IPX5", Form: "Neckband" }, strengths: ["Long continuous battery", "Secure for movement"], limitation: "Neckband form factor" },
  { id: "a12", name: "Open-Ear Clip", brand: "NORD", category: categories[0], kind: "Earbuds", price: 11900, stock: 9, image: "photo-1590650046871-92c887180603", specs: { "Noise cancellation": "Open-ear design", "Battery life": "6 hours · 24 with case", Connectivity: "Bluetooth 5.3", Weight: "8 g per side", Awareness: "Full environmental" }, strengths: ["Situational awareness", "Comfortable long wear"], limitation: "No isolation from noise" },
  { id: "a13", name: "Gaming Headset X", brand: "KEYSTONE", category: categories[0], kind: "Headphones", price: 8900, stock: 21, image: "photo-1618366712010-f4ae9c647dcb", specs: { "Noise cancellation": "Passive", "Battery life": "Wired only", Connectivity: "3.5 mm · USB", Microphone: "Detachable boom", Surround: "Virtual 7.1 (USB)" }, strengths: ["Detachable mic", "Virtual surround via USB"], limitation: "No wireless option" },
  { id: "a14", name: "Soundbar Mini", brand: "AERIS", category: categories[0], kind: "Speakers", price: 15900, stock: 6, image: "photo-1545454675-3531b543be5d", specs: { Channels: "2.1 virtual", Connectivity: "HDMI ARC · Optical · Bluetooth", Power: "80 W peak", Width: "60 cm" }, strengths: ["Compact TV companion", "Multiple inputs"], limitation: "No dedicated subwoofer included" },

  // ── Mobile & Power (14) ─────────────────────────────────────────────
  { id: "m1", name: "Nano 65 GaN", brand: "VOLT", category: categories[1], kind: "Chargers", price: 3900, stock: 26, image: "photo-1601972599720-36938d4ecd31", specs: { Output: "65 W", Ports: "2 USB-C · 1 USB-A", Protocol: "USB PD 3.0", Input: "100–240 V" }, strengths: ["Three charging ports", "USB PD support"], limitation: "65 W shared across ports", compatible: ["a1", "a2", "a3", "m2", "m3", "t1", "c2"] },
  { id: "m2", name: "Reserve 20K", brand: "NORD", category: categories[1], kind: "Power banks", price: 5900, stock: 4, image: "photo-1609592424825-5c89b467a05b", specs: { Capacity: "20,000 mAh", Output: "30 W USB-C", Ports: "1 USB-C · 1 USB-A", Weight: "345 g" }, strengths: ["30 W portable power", "20,000 mAh demo capacity"], limitation: "345 g adds travel weight", compatible: ["m1", "m3", "t1"] },
  { id: "m3", name: "Flex USB-C 100", brand: "VOLT", category: categories[1], kind: "Cables", price: 1500, stock: 40, image: "photo-1555617981-dac3880eac6e", specs: { Power: "100 W", Length: "2 m", Connectors: "USB-C to USB-C", Data: "480 Mbps" }, strengths: ["100 W charging", "2 m reach"], limitation: "Not a video-output cable", compatible: ["m1", "m2", "t1", "c2"] },
  { id: "m4", name: "GaN 100 Desk", brand: "VOLT", category: categories[1], kind: "Chargers", price: 5900, stock: 14, image: "photo-1625948515291-69613efd103f", specs: { Output: "100 W", Ports: "3 USB-C · 1 USB-A", Protocol: "USB PD 3.1", Input: "100–240 V" }, strengths: ["100 W single-port capable", "Four ports total"], limitation: "Larger footprint than Nano 65" },
  { id: "m5", name: "Slim 10K Mag", brand: "NORD", category: categories[1], kind: "Power banks", price: 4900, stock: 22, image: "photo-1609592424825-5c89b467a05b", specs: { Capacity: "10,000 mAh", Output: "15 W MagSafe-compatible + 20 W USB-C", Weight: "210 g", Thickness: "12 mm" }, strengths: ["Magnetic attachment demo", "Slim profile"], limitation: "Lower capacity than Reserve 20K" },
  { id: "m6", name: "Car PD 45", brand: "VOLT", category: categories[1], kind: "Chargers", price: 2900, stock: 33, image: "photo-1616432043562-3671ea758ecc", specs: { Output: "45 W", Ports: "2 USB-C", Protocol: "USB PD 3.0", Form: "Car cigarette lighter" }, strengths: ["Dual USB-C car charging", "Compact"], limitation: "Requires 12 V car socket" },
  { id: "m7", name: "Braided USB-C 1.5", brand: "NORD", category: categories[1], kind: "Cables", price: 1200, stock: 55, image: "photo-1558618666-fcd25c85cd64", specs: { Power: "60 W", Length: "1.5 m", Connectors: "USB-C to USB-C", Data: "480 Mbps", Jacket: "Braided nylon" }, strengths: ["Durable braid", "Good everyday length"], limitation: "60 W max, not 100 W" },
  { id: "m8", name: "Wall GaN 30", brand: "VOLT", category: categories[1], kind: "Chargers", price: 2400, stock: 38, image: "photo-1601972599720-36938d4ecd31", specs: { Output: "30 W", Ports: "1 USB-C", Protocol: "USB PD 3.0", Fold: "Foldable pins" }, strengths: ["Travel-friendly foldable pins", "Small size"], limitation: "Single port only" },
  { id: "m9", name: "Reserve 27K", brand: "AERIS", category: categories[1], kind: "Power banks", price: 7900, stock: 8, image: "photo-1609592424825-5c89b467a05b", specs: { Capacity: "27,000 mAh", Output: "45 W USB-C", Ports: "2 USB-C · 1 USB-A", Weight: "420 g", Display: "Percentage display" }, strengths: ["High capacity", "On-device percentage"], limitation: "Heavier for daily carry" },
  { id: "m10", name: "Lightning to USB-C", brand: "NORD", category: categories[1], kind: "Cables", price: 1800, stock: 27, image: "photo-1555617981-dac3880eac6e", specs: { Power: "20 W", Length: "1 m", Connectors: "USB-C to Lightning", Data: "USB 2.0", Certification: "Demo MFi-style" }, strengths: ["Common phone connector", "Reliable length"], limitation: "20 W max for Lightning devices" },
  { id: "m11", name: "Multi-Port Hub Charger", brand: "KEYSTONE", category: categories[1], kind: "Chargers", price: 6900, stock: 11, image: "photo-1625948515291-69613efd103f", specs: { Output: "65 W total", Ports: "2 USB-C · 2 USB-A", Protocol: "USB PD 3.0", Form: "Desktop brick" }, strengths: ["Four ports for desk use", "Decent total power"], limitation: "Not GaN-compact" },
  { id: "m12", name: "Wireless Pad 15W", brand: "SONORA", category: categories[1], kind: "Chargers", price: 3200, stock: 25, image: "photo-1616432043562-3671ea758ecc", specs: { Output: "15 W max", Standard: "Qi", Indicators: "LED status", Cable: "USB-C included" }, strengths: ["Simple wireless top-up", "Low desk clutter"], limitation: "Slower than wired PD" },
  { id: "m13", name: "Travel Adapter Universal", brand: "VOLT", category: categories[1], kind: "Chargers", price: 3500, stock: 17, image: "photo-1601972599720-36938d4ecd31", specs: { Output: "No built-in charging", Ports: "2 USB-A · 1 USB-C passthrough", Regions: "US · EU · UK · AU", Safety: "Fuse protected" }, strengths: ["Multi-region travel", "Fuse protection"], limitation: "Does not convert voltage" },
  { id: "m14", name: "USB-C to HDMI 4K", brand: "KEYSTONE", category: categories[1], kind: "Cables", price: 2800, stock: 20, image: "photo-1558618666-fcd25c85cd64", specs: { Resolution: "4K 60 Hz", Length: "1.8 m", Connectors: "USB-C to HDMI", HDR: "Supported" }, strengths: ["4K display out", "Common docking use"], limitation: "Requires DisplayPort Alt Mode host" },

  // ── Computing & Workspace (16) ──────────────────────────────────────
  { id: "w1", name: "Type 75", brand: "KEYSTONE", category: categories[2], kind: "Keyboards", price: 9900, stock: 16, image: "photo-1587829741301-dc798b83add3", specs: { Layout: "75% · 84 keys", Connectivity: "USB-C · Bluetooth", Switches: "Tactile mechanical", Platforms: "Windows · macOS" }, strengths: ["Compact mechanical layout", "Windows and macOS"], limitation: "No number pad", compatible: ["w2", "w3"] },
  { id: "w2", name: "Glide Anywhere", brand: "NORD", category: categories[2], kind: "Mice", price: 4900, stock: 22, image: "photo-1527864550417-7fd91fc51a46", specs: { Sensor: "4,000 DPI", Connectivity: "Bluetooth · USB receiver", Buttons: "6", Platforms: "Windows · macOS" }, strengths: ["Two connection modes", "Six configurable buttons"], limitation: "Right-handed shape", compatible: ["w1", "w3"] },
  { id: "w3", name: "Hub Pro 7", brand: "KEYSTONE", category: categories[2], kind: "Docks and hubs", price: 7900, stock: 13, image: "photo-1625948515291-69613efd103f", specs: { Ports: "HDMI 4K · 3 USB-A · 2 USB-C · SD · Ethernet", Power: "Pass-through 100 W", Form: "Compact aluminum" }, strengths: ["Single-cable expansion", "100 W pass-through"], limitation: "Requires USB-C host with DP Alt Mode", compatible: ["w1", "w2"] },
  { id: "w4", name: "Laptop Lume 14", brand: "AERIS", category: categories[2], kind: "Laptops", price: 100000, stock: 4, image: "photo-1496181133206-80ce9b88a853", specs: { Display: "14-inch 2.2K", Processor: "Demo octa-core", RAM: "16 GB", Storage: "512 GB SSD", Weight: "1.35 kg", Battery: "Up to 12 hours demo" }, strengths: ["Balanced portable work machine", "Good battery claim"], limitation: "Synthetic demo specs only" },
  { id: "w5", name: "Laptop Lume 16", brand: "AERIS", category: categories[2], kind: "Laptops", price: 140000, stock: 2, image: "photo-1525547719571-a2d4ac882e4d", specs: { Display: "16-inch 3K", Processor: "Demo high-performance", RAM: "32 GB", Storage: "1 TB SSD", Weight: "1.85 kg", Battery: "Up to 10 hours demo" }, strengths: ["Larger screen for creative work", "More RAM"], limitation: "Heavier than 14-inch models" },
  { id: "w6", name: "Laptop Nimbus Air 13", brand: "NORD", category: categories[2], kind: "Laptops", price: 90000, stock: 7, image: "photo-1517336714731-489689fd1ca8", specs: { Display: "13.3-inch FHD", Processor: "Demo efficiency core", RAM: "8 GB", Storage: "256 GB SSD", Weight: "1.1 kg", Battery: "Up to 14 hours demo" }, strengths: ["Lightest laptop in catalog", "Long battery claim"], limitation: "8 GB RAM may limit heavy multitasking" },
  { id: "w7", name: "Ergo Split Keys", brand: "KEYSTONE", category: categories[2], kind: "Keyboards", price: 12900, stock: 9, image: "photo-1587829741301-dc798b83add3", specs: { Layout: "Split ergonomic", Connectivity: "USB-C · Bluetooth", Switches: "Low-profile tactile", Platforms: "Windows · macOS · Linux" }, strengths: ["Ergonomic split design", "Multi-OS"], limitation: "Learning curve for split layout" },
  { id: "w8", name: "Precision Trackball", brand: "NORD", category: categories[2], kind: "Mice", price: 5900, stock: 11, image: "photo-1527864550417-7fd91fc51a46", specs: { Sensor: "Trackball", Connectivity: "USB · Bluetooth", Buttons: "5", Platforms: "Windows · macOS" }, strengths: ["Minimal desk movement", "Precise cursor control"], limitation: "Different muscle memory than mice" },
  { id: "w9", name: "Laptop Sleeve 14", brand: "SONORA", category: categories[2], kind: "Laptop sleeves", price: 3500, stock: 30, image: "photo-1553062407-98eeb64c6a62", specs: { Fits: "Up to 14-inch", Material: "Neoprene + felt", Pockets: "Front accessory pocket", Closure: "Zipper" }, strengths: ["Light protection", "Accessory pocket"], limitation: "Not a hard-shell case" },
  { id: "w10", name: "Laptop Sleeve 16", brand: "SONORA", category: categories[2], kind: "Laptop sleeves", price: 3900, stock: 18, image: "photo-1553062407-98eeb64c6a62", specs: { Fits: "Up to 16-inch", Material: "Neoprene + felt", Pockets: "Front accessory pocket", Closure: "Zipper" }, strengths: ["Fits larger laptops", "Soft lining"], limitation: "Bulkier than 14-inch sleeve" },
  { id: "w11", name: "Monitor Arm Single", brand: "KEYSTONE", category: categories[2], kind: "Stands", price: 8900, stock: 10, image: "photo-1527864550417-7fd91fc51a46", specs: { Capacity: "Up to 9 kg", Mount: "VESA 75/100", Adjust: "Height · tilt · swivel · rotate", Clamp: "Desk clamp included" }, strengths: ["Full range of motion", "Desk space recovery"], limitation: "Requires VESA-compatible monitor" },
  { id: "w12", name: "Laptop Stand Aluminum", brand: "NORD", category: categories[2], kind: "Stands", price: 4500, stock: 24, image: "photo-1616432043562-3671ea758ecc", specs: { Material: "Aluminum", Adjust: "6 angles", Ventilation: "Open design", Fits: "Up to 17-inch" }, strengths: ["Cooling airflow", "Multiple angles"], limitation: "Does not raise keyboard height enough for all users" },
  { id: "w13", name: "Webcam 4K Pro", brand: "AERIS", category: categories[2], kind: "Webcams", price: 12900, stock: 8, image: "photo-1587829741301-dc798b83add3", specs: { Resolution: "4K 30 fps · 1080p 60 fps", FOV: "90°", Microphone: "Dual stereo", Mount: "Clip + tripod thread" }, strengths: ["4K option", "Built-in mics"], limitation: "Requires good lighting for best results" },
  { id: "w14", name: "Webcam FHD Quiet", brand: "NORD", category: categories[2], kind: "Webcams", price: 5900, stock: 19, image: "photo-1587829741301-dc798b83add3", specs: { Resolution: "1080p 30 fps", FOV: "78°", Microphone: "Single with noise reduction", Mount: "Clip" }, strengths: ["Affordable 1080p", "Noise-reduced mic"], limitation: "No 4K or 60 fps" },
  { id: "w15", name: "USB-C Dock Mini", brand: "KEYSTONE", category: categories[2], kind: "Docks and hubs", price: 4900, stock: 15, image: "photo-1625948515291-69613efd103f", specs: { Ports: "HDMI · 2 USB-A · USB-C · SD", Power: "Pass-through 60 W", Form: "Pocketable" }, strengths: ["Very portable", "Essential ports"], limitation: "Fewer ports than Hub Pro 7" },
  { id: "w16", name: "Mechanical Tenkeyless", brand: "KEYSTONE", category: categories[2], kind: "Keyboards", price: 7900, stock: 14, image: "photo-1587829741301-dc798b83add3", specs: { Layout: "TKL · 87 keys", Connectivity: "USB-C only", Switches: "Linear mechanical", Platforms: "Windows · macOS" }, strengths: ["Classic TKL size", "Linear switches"], limitation: "No Bluetooth option" },

  // ── Smart Home & Security (10) ──────────────────────────────────────
  { id: "s1", name: "Sense Cam Indoor", brand: "AERIS", category: categories[3], kind: "Smart cameras", price: 6900, stock: 18, image: "photo-1558618666-fcd25c85cd64", specs: { Resolution: "1080p", Night: "Infrared", Audio: "Two-way", Storage: "Local + cloud demo", Power: "USB-C" }, strengths: ["Two-way audio", "Night vision"], limitation: "Indoor use only" },
  { id: "s2", name: "Sense Cam Outdoor", brand: "AERIS", category: categories[3], kind: "Smart cameras", price: 9900, stock: 9, image: "photo-1558618666-fcd25c85cd64", specs: { Resolution: "2K", Night: "Color night vision", Audio: "Two-way", Weather: "IP66", Power: "Wired" }, strengths: ["Weather-resistant", "Higher resolution"], limitation: "Requires outdoor power access" },
  { id: "s3", name: "Door Sense", brand: "NORD", category: categories[3], kind: "Smart sensors", price: 2900, stock: 27, image: "photo-1558002038-1055907df827", specs: { Type: "Contact sensor", Protocol: "Demo Zigbee", Battery: "2 years claim", Alerts: "App push" }, strengths: ["Long battery claim", "Simple install"], limitation: "Requires compatible hub" },
  { id: "s4", name: "Smart Plug Duo", brand: "VOLT", category: categories[3], kind: "Smart plugs", price: 3500, stock: 32, image: "photo-1558002038-1055907df827", specs: { Count: "2 plugs", Protocol: "Wi-Fi", Power: "15 A each", Scheduling: "App + voice demo" }, strengths: ["No hub required", "Scheduling"], limitation: "Uses Wi-Fi bandwidth" },
  { id: "s5", name: "Temp & Humidity Sense", brand: "NORD", category: categories[3], kind: "Smart sensors", price: 2400, stock: 21, image: "photo-1558002038-1055907df827", specs: { Metrics: "Temperature · humidity", Protocol: "Demo Zigbee", Battery: "18 months claim", Display: "E-ink optional" }, strengths: ["Dual metrics", "Low power"], limitation: "Hub required for full automation" },
  { id: "s6", name: "Motion Guard", brand: "AERIS", category: categories[3], kind: "Smart sensors", price: 3900, stock: 14, image: "photo-1558618666-fcd25c85cd64", specs: { Type: "PIR motion", Range: "8 m", Protocol: "Demo Zigbee", Night: "Works in dark" }, strengths: ["Reliable PIR", "Dark operation"], limitation: "Pets may trigger false alerts" },
  { id: "s7", name: "Smart Bulb Color 2-pack", brand: "VOLT", category: categories[3], kind: "Smart lighting", price: 4500, stock: 25, image: "photo-1565814329452-e1efa11c5b89", specs: { Type: "A19 color", Protocol: "Wi-Fi", Brightness: "800 lm", Features: "Scenes · schedules" }, strengths: ["No hub needed", "Full color"], limitation: "Two bulbs only in pack" },
  { id: "s8", name: "Doorbell Cam", brand: "AERIS", category: categories[3], kind: "Smart cameras", price: 11900, stock: 6, image: "photo-1558618666-fcd25c85cd64", specs: { Resolution: "1536p", Night: "Infrared", Audio: "Two-way", Power: "Existing doorbell or battery", Storage: "Local + cloud demo" }, strengths: ["Doorbell form factor", "Two-way talk"], limitation: "Installation may require wiring knowledge" },
  { id: "s9", name: "Leak Guard", brand: "NORD", category: categories[3], kind: "Smart sensors", price: 3200, stock: 16, image: "photo-1558002038-1055907df827", specs: { Type: "Water leak", Protocol: "Demo Zigbee", Battery: "2 years claim", Alerts: "Immediate push" }, strengths: ["Early leak detection", "Long battery"], limitation: "Requires hub and placement near risk areas" },
  { id: "s10", name: "Smart Switch Dimmer", brand: "VOLT", category: categories[3], kind: "Smart lighting", price: 4800, stock: 12, image: "photo-1565814329452-e1efa11c5b89", specs: { Type: "In-wall dimmer", Protocol: "Wi-Fi", Load: "LED · CFL · incandescent", Neutral: "Required" }, strengths: ["Replaces existing switch", "Dimmer support"], limitation: "Neutral wire usually required" },

  // ── Automotive Gadgets (8) ──────────────────────────────────────────
  { id: "v1", name: "Dash Cam Dual", brand: "AERIS", category: categories[4], kind: "Dash cams", price: 12900, stock: 11, image: "photo-1449965408869-eaa3f722e40d", specs: { Resolution: "Front 1440p · Rear 1080p", Night: "WDR", Storage: "MicroSD up to 128 GB", Power: "Cigarette lighter" }, strengths: ["Front + rear coverage", "WDR night"], limitation: "MicroSD not included" },
  { id: "v2", name: "Phone Mount Mag", brand: "NORD", category: categories[4], kind: "Phone mounts", price: 2900, stock: 34, image: "photo-1616432043562-3671ea758ecc", specs: { Type: "Magnetic vent mount", Magnets: "Strong N52 demo", Compatibility: "Most phones with metal plate or MagSafe-style", Rotate: "360°" }, strengths: ["Quick attach/detach", "360° rotation"], limitation: "Vent mount may not fit all vents" },
  { id: "v3", name: "OBD Reader Basic", brand: "VOLT", category: categories[4], kind: "OBD tools", price: 3900, stock: 15, image: "photo-1486262715619-67b85e0b08d3", specs: { Protocol: "OBD-II", Connectivity: "Bluetooth", App: "Demo companion", Codes: "Read + clear" }, strengths: ["Bluetooth convenience", "Code reading"], limitation: "Basic diagnostics only" },
  { id: "v4", name: "Car Vacuum Compact", brand: "NORD", category: categories[4], kind: "Car care", price: 4500, stock: 13, image: "photo-1558618666-fcd25c85cd64", specs: { Power: "12 V", Suction: "Demo strong", Cord: "4 m", Attachments: "3 nozzles" }, strengths: ["Long cord", "Multiple nozzles"], limitation: "Requires car 12 V power while running" },
  { id: "v5", name: "Tire Inflator Portable", brand: "VOLT", category: categories[4], kind: "Car care", price: 5900, stock: 10, image: "photo-1486262715619-67b85e0b08d3", specs: { Power: "12 V · rechargeable", "Max pressure": "150 PSI", Display: "Digital", "Modes": "Car · bike · ball" }, strengths: ["Rechargeable option", "Digital readout"], limitation: "Not for heavy truck tires" },
  { id: "v6", name: "Dash Cam Single", brand: "AERIS", category: categories[4], kind: "Dash cams", price: 7900, stock: 17, image: "photo-1449965408869-eaa3f722e40d", specs: { Resolution: "1440p", Night: "WDR", Storage: "MicroSD up to 128 GB", Power: "Cigarette lighter", GPS: "Optional module" }, strengths: ["Lower price than dual", "Good resolution"], limitation: "Front only; GPS sold separately" },
  { id: "v7", name: "Seat Gap Organizer", brand: "SONORA", category: categories[4], kind: "Car organizers", price: 1800, stock: 40, image: "photo-1553062407-98eeb64c6a62", specs: { Material: "PU leather + felt", Pockets: "Multiple", Fit: "Most front seats", Charge: "Pass-through holes" }, strengths: ["Keeps small items accessible", "Charge cable friendly"], limitation: "Cosmetic rather than structural" },
  { id: "v8", name: "Wireless Car Charger Mount", brand: "VOLT", category: categories[4], kind: "Phone mounts", price: 4900, stock: 19, image: "photo-1616432043562-3671ea758ecc", specs: { Charging: "15 W Qi", Mount: "Air vent or dash", Auto: "Auto-clamp", Compatibility: "Qi phones" }, strengths: ["Charges while mounted", "Auto clamp"], limitation: "Requires 12 V power for charging" },

  // ── Travel & Portable Tech (10) ─────────────────────────────────────
  { id: "t1", name: "Travel Adapter Pro", brand: "ROAM", category: categories[5], kind: "Travel adapters", price: 4500, stock: 20, image: "photo-1544197150-b99a580bb7a8", specs: { Regions: "US · EU · UK · AU · more", USB: "2 USB-A · 1 USB-C 30 W", Safety: "Surge + fuse", Form: "Compact cube" }, strengths: ["Built-in 30 W USB-C", "Wide region coverage"], limitation: "Does not convert voltage", compatible: ["m1", "m2", "m3"] },
  { id: "t2", name: "Mobile Wi-Fi Go", brand: "ROAM", category: categories[5], kind: "Portable routers", price: 7900, stock: 3, image: "photo-1544197150-b99a580bb7a8", specs: { Network: "4G LTE", WiFi: "Wi-Fi 5", Battery: "3,000 mAh", SIM: "Nano-SIM required" }, strengths: ["Portable Wi-Fi network"], limitation: "Data plan not included" },
  { id: "t3", name: "Packing Cubes Set", brand: "ROAM", category: categories[5], kind: "Travel organizers", price: 3200, stock: 28, image: "photo-1553062407-98eeb64c6a62", specs: { Pieces: "4 cubes", Material: "Nylon", Sizes: "S · M · L · XL", Closure: "Mesh + zipper" }, strengths: ["Organize luggage", "Mesh visibility"], limitation: "Not waterproof" },
  { id: "t4", name: "Neck Pillow Memory", brand: "NORD", category: categories[5], kind: "Travel comfort", price: 2900, stock: 22, image: "photo-1553062407-98eeb64c6a62", specs: { Fill: "Memory foam", Cover: "Removable · washable", Form: "U-shape", Carry: "Clip included" }, strengths: ["Supportive foam", "Washable cover"], limitation: "Bulkier than inflatable options" },
  { id: "t5", name: "Portable SSD 1TB", brand: "KEYSTONE", category: categories[5], kind: "Storage", price: 9900, stock: 12, image: "photo-1597872200969-2b65d56bd16b", specs: { Capacity: "1 TB", Interface: "USB-C 10 Gbps", Speed: "Up to 1050 MB/s demo", Form: "Pocket SSD" }, strengths: ["Fast transfers", "Compact"], limitation: "Synthetic speed claims" },
  { id: "t6", name: "Luggage Scale Digital", brand: "ROAM", category: categories[5], kind: "Travel tools", price: 1800, stock: 35, image: "photo-1553062407-98eeb64c6a62", specs: { Max: "50 kg", Display: "LCD", Power: "CR2032", Units: "kg · lb" }, strengths: ["Avoid overweight fees", "Simple"], limitation: "Battery not rechargeable" },
  { id: "t7", name: "Universal SIM Adapter", brand: "ROAM", category: categories[5], kind: "Travel tools", price: 900, stock: 50, image: "photo-1544197150-b99a580bb7a8", specs: { Sizes: "Nano · Micro · Standard", Material: "Metal + plastic", Tool: "Ejector pin included" }, strengths: ["All common SIM sizes", "Inexpensive"], limitation: "Physical adapter only, no eSIM" },
  { id: "t8", name: "Portable Monitor 15.6", brand: "AERIS", category: categories[5], kind: "Monitors", price: 18900, stock: 5, image: "photo-1525547719571-a2d4ac882e4d", specs: { Size: "15.6-inch FHD", Ports: "USB-C · mini HDMI", Weight: "780 g", Stand: "Smart case included" }, strengths: ["Second screen for travel", "USB-C single cable"], limitation: "Brightness lower than desktop monitors" },
  { id: "t9", name: "Noise Plug Set", brand: "SONORA", category: categories[5], kind: "Travel comfort", price: 1200, stock: 45, image: "photo-1572569511254-d8f925fe2cbb", specs: { Type: "Foam earplugs", SNR: "Demo 33 dB", Pairs: "10 pairs", Case: "Carry case included" }, strengths: ["Inexpensive hearing protection", "Multiple pairs"], limitation: "Disposable style" },
  { id: "t10", name: "Cable Organizer Kit", brand: "ROAM", category: categories[5], kind: "Travel organizers", price: 1500, stock: 38, image: "photo-1553062407-98eeb64c6a62", specs: { Pieces: "Ties · pouch · clips", Material: "Elastic + fabric", Capacity: "Small electronics cables" }, strengths: ["Reduces cable chaos", "Reusable"], limitation: "Does not charge or convert" },

  // ── Creator & Photography (12) ──────────────────────────────────────
  { id: "c1", name: "Creator Mic USB", brand: "SONORA", category: categories[6], kind: "Microphones", price: 7900, stock: 17, image: "photo-1590602847861-f357a9332bbc", specs: { Pattern: "Cardioid", Connection: "USB-C", Audio: "24-bit / 48 kHz", Monitoring: "3.5 mm headphone out" }, strengths: ["Direct headphone monitoring", "USB-C connection"], limitation: "No XLR output", compatible: ["c2", "c3"] },
  { id: "c2", name: "Softbox Light Mini", brand: "AERIS", category: categories[6], kind: "Lighting", price: 5900, stock: 14, image: "photo-1516035069371-29a1b824cc2e", specs: { Power: "USB-C powered", Temperature: "3200–5600 K", Mount: "Desktop stand", Diffusion: "Softbox included" }, strengths: ["Adjustable color temperature", "Soft diffusion"], limitation: "Lower output than studio lights", compatible: ["c1", "c3"] },
  { id: "c3", name: "Desk Tripod Flex", brand: "NORD", category: categories[6], kind: "Tripods", price: 3500, stock: 23, image: "photo-1606983340126-99ab4feaa64a", specs: { Height: "Up to 30 cm", Head: "Ball head", Mount: "1/4-20", Legs: "Flexible" }, strengths: ["Flexible legs for odd angles", "Compact"], limitation: "Desktop height only", compatible: ["c1", "c2"] },
  { id: "c4", name: "Lav Mic Wireless", brand: "SONORA", category: categories[6], kind: "Microphones", price: 9900, stock: 9, image: "photo-1590602847861-f357a9332bbc", specs: { Type: "Wireless lavalier", Range: "50 m demo", Battery: "6 hours", Output: "3.5 mm · USB-C receiver" }, strengths: ["Wireless freedom", "Phone + camera friendly"], limitation: "Range depends on environment" },
  { id: "c5", name: "Ring Light 10-inch", brand: "AERIS", category: categories[6], kind: "Lighting", price: 4500, stock: 16, image: "photo-1516035069371-29a1b824cc2e", specs: { Size: "10-inch", Temperature: "3200–5600 K", Power: "USB", Mount: "Phone holder + stand" }, strengths: ["Even facial lighting", "Phone-friendly"], limitation: "Small diameter for full-body" },
  { id: "c6", name: "Action Mount Kit", brand: "NORD", category: categories[6], kind: "Mounts", price: 3900, stock: 18, image: "photo-1606983340126-99ab4feaa64a", specs: { Pieces: "Handle · chest · helmet · suction", Compatibility: "Common action camera thread", Material: "Plastic + rubber" }, strengths: ["Multiple mounting options", "Action-oriented"], limitation: "Camera not included" },
  { id: "c7", name: "SD Card 128GB V30", brand: "KEYSTONE", category: categories[6], kind: "Storage", price: 2400, stock: 40, image: "photo-1597872200969-2b65d56bd16b", specs: { Capacity: "128 GB", Speed: "V30 · U3", Type: "microSDXC + adapter", Write: "Up to 90 MB/s demo" }, strengths: ["Good for 4K video", "Adapter included"], limitation: "Synthetic speed claims" },
  { id: "c8", name: "Gimbal Mini 3-axis", brand: "AERIS", category: categories[6], kind: "Stabilizers", price: 12900, stock: 7, image: "photo-1606983340126-99ab4feaa64a", specs: { Axes: "3-axis", Payload: "Up to 280 g", Battery: "8 hours demo", "Modes": "Follow · lock · selfie" }, strengths: ["Smooth handheld video", "Multiple modes"], limitation: "Payload limit excludes heavier phones/cases" },
  { id: "c9", name: "Background Stand Kit", brand: "NORD", category: categories[6], kind: "Studio gear", price: 6900, stock: 8, image: "photo-1516035069371-29a1b824cc2e", specs: { Width: "Up to 2 m", Height: "Up to 2 m", Material: "Aluminum", Includes: "Clips · carry bag" }, strengths: ["Portable backdrop support", "Carry bag"], limitation: "Backdrop fabric sold separately" },
  { id: "c10", name: "Shotgun Mic Compact", brand: "SONORA", category: categories[6], kind: "Microphones", price: 8900, stock: 11, image: "photo-1590602847861-f357a9332bbc", specs: { Pattern: "Supercardioid", Connection: "3.5 mm", Power: "Plug-in power", Shock: "Mount included" }, strengths: ["Directional for video", "Shock mount"], limitation: "Requires camera with plug-in power" },
  { id: "c11", name: "LED Panel 12-inch", brand: "AERIS", category: categories[6], kind: "Lighting", price: 9900, stock: 6, image: "photo-1516035069371-29a1b824cc2e", specs: { Size: "12-inch panel", Temperature: "3200–5600 K", Power: "AC · battery option", Brightness: "Demo high output" }, strengths: ["Higher output than mini softbox", "Battery option"], limitation: "Battery sold separately" },
  { id: "c12", name: "Phone Cage Rig", brand: "KEYSTONE", category: categories[6], kind: "Mounts", price: 5500, stock: 13, image: "photo-1606983340126-99ab4feaa64a", specs: { Fit: "Most modern phones", "Cold shoes": "2", Handles: "Side grip", Mount: "1/4-20 bottom" }, strengths: ["Modular phone video", "Cold shoe accessories"], limitation: "Adds bulk to phone" },

  // ── Wearables (8) ───────────────────────────────────────────────────
  { id: "r1", name: "Pulse Band Pro", brand: "NORD", category: categories[7], kind: "Fitness bands", price: 7900, stock: 20, image: "photo-1575311373937-040b8e1fd5b6", specs: { Display: "AMOLED 1.4-inch", Sensors: "Heart · SpO2 · sleep", Battery: "14 days demo", Water: "5 ATM" }, strengths: ["Long battery claim", "Core health metrics"], limitation: "Not a medical device" },
  { id: "r2", name: "Watch Air Lite", brand: "AERIS", category: categories[7], kind: "Smartwatches", price: 14900, stock: 9, image: "photo-1523275335684-37898b6baf30", specs: { Display: "1.3-inch always-on", Sensors: "Heart · GPS · SpO2", Battery: "2 days demo", Water: "5 ATM" }, strengths: ["Built-in GPS", "Always-on option"], limitation: "Shorter battery than band" },
  { id: "r3", name: "Sleep Ring Demo", brand: "SONORA", category: categories[7], kind: "Rings", price: 19900, stock: 5, image: "photo-1523275335684-37898b6baf30", specs: { Sensors: "Heart · temp · movement", Battery: "7 days demo", App: "Sleep scoring", Sizes: "Multiple" }, strengths: ["Discreet form", "Sleep focus"], limitation: "Limited daytime features" },
  { id: "r4", name: "Kids Tracker Clip", brand: "NORD", category: categories[7], kind: "Trackers", price: 4900, stock: 16, image: "photo-1575311373937-040b8e1fd5b6", specs: { Form: "Clip-on", Sensors: "Steps · activity", Battery: "30 days demo", Alerts: "Parent app" }, strengths: ["Simple for children", "Long battery"], limitation: "No GPS on device" },
  { id: "r5", name: "Sport Watch Rugged", brand: "AERIS", category: categories[7], kind: "Smartwatches", price: 17900, stock: 7, image: "photo-1523275335684-37898b6baf30", specs: { Display: "1.4-inch MIP", Sensors: "GPS · heart · barometer", Battery: "20 days demo", Water: "10 ATM" }, strengths: ["Long battery + rugged", "Outdoor metrics"], limitation: "Lower resolution display" },
  { id: "r6", name: "Posture Clip", brand: "SONORA", category: categories[7], kind: "Trackers", price: 3900, stock: 14, image: "photo-1575311373937-040b8e1fd5b6", specs: { Type: "Posture reminder", Form: "Clip", Battery: "10 days demo", Alerts: "Vibration" }, strengths: ["Simple posture feedback", "Discrete"], limitation: "Single-purpose device" },
  { id: "r7", name: "Band Sport Colors", brand: "NORD", category: categories[7], kind: "Fitness bands", price: 5900, stock: 25, image: "photo-1575311373937-040b8e1fd5b6", specs: { Display: "Color TFT", Sensors: "Heart · steps", Battery: "10 days demo", Water: "5 ATM", Bands: "Interchangeable" }, strengths: ["Color screen", "Swappable bands"], limitation: "Fewer sensors than Pro" },
  { id: "r8", name: "Hybrid Watch Classic", brand: "AERIS", category: categories[7], kind: "Smartwatches", price: 12900, stock: 11, image: "photo-1523275335684-37898b6baf30", specs: { Display: "Analog + hidden digital", Sensors: "Steps · sleep · notifications", Battery: "6 months demo", Water: "5 ATM" }, strengths: ["Traditional look", "Very long battery"], limitation: "Limited smart features" },

  // ── Networking & Storage (8) ────────────────────────────────────────
  { id: "n1", name: "Mesh Wi-Fi Duo", brand: "KEYSTONE", category: categories[8], kind: "Routers", price: 15900, stock: 8, image: "photo-1544197150-b99a580bb7a8", specs: { Standard: "Wi-Fi 6", Nodes: "2-pack", Coverage: "Demo 3,000 sq ft", Ports: "Gigabit Ethernet" }, strengths: ["Mesh coverage", "Wi-Fi 6"], limitation: "Requires solid backhaul placement" },
  { id: "n2", name: "USB-C SSD 2TB", brand: "KEYSTONE", category: categories[8], kind: "Storage", price: 14900, stock: 10, image: "photo-1597872200969-2b65d56bd16b", specs: { Capacity: "2 TB", Interface: "USB-C 10 Gbps", Speed: "Up to 1050 MB/s demo", Form: "Pocket" }, strengths: ["Large portable capacity", "Fast interface"], limitation: "Synthetic speed claims" },
  { id: "n3", name: "NAS 2-Bay Starter", brand: "AERIS", category: categories[8], kind: "NAS", price: 22900, stock: 4, image: "photo-1597872200969-2b65d56bd16b", specs: { Bays: "2", RAID: "0 · 1 · JBOD", Network: "1 GbE", Apps: "Backup · media demo" }, strengths: ["Home backup focus", "RAID 1 option"], limitation: "Drives not included" },
  { id: "n4", name: "Wi-Fi 6 Router", brand: "NORD", category: categories[8], kind: "Routers", price: 9900, stock: 12, image: "photo-1544197150-b99a580bb7a8", specs: { Standard: "Wi-Fi 6", Bands: "Dual-band", Ports: "4× Gigabit", Features: "OFDMA · MU-MIMO demo" }, strengths: ["Modern Wi-Fi 6", "Solid port count"], limitation: "Single unit, not mesh" },
  { id: "n5", name: "USB Hub 7-port", brand: "KEYSTONE", category: categories[8], kind: "Hubs", price: 3500, stock: 22, image: "photo-1625948515291-69613efd103f", specs: { Ports: "7 USB-A 3.0", Power: "External adapter", Data: "5 Gbps shared" }, strengths: ["Many ports", "Powered"], limitation: "USB-A only, no USB-C" },
  { id: "n6", name: "Ethernet Adapter USB-C", brand: "NORD", category: categories[8], kind: "Adapters", price: 2800, stock: 26, image: "photo-1544197150-b99a580bb7a8", specs: { Speed: "1 Gbps", Connector: "USB-C to RJ45", Chipset: "Demo reliable" }, strengths: ["Stable wired connection", "Simple"], limitation: "Requires USB-C host" },
  { id: "n7", name: "microSD 256GB V30", brand: "KEYSTONE", category: categories[8], kind: "Storage", price: 3900, stock: 30, image: "photo-1597872200969-2b65d56bd16b", specs: { Capacity: "256 GB", Speed: "V30 · U3", Type: "microSDXC + adapter", Write: "Up to 90 MB/s demo" }, strengths: ["Higher capacity card", "Adapter included"], limitation: "Synthetic speed claims" },
  { id: "n8", name: "Range Extender Wi-Fi 6", brand: "NORD", category: categories[8], kind: "Extenders", price: 5900, stock: 14, image: "photo-1544197150-b99a580bb7a8", specs: { Standard: "Wi-Fi 6", Mode: "Extender · AP", Ports: "1 Ethernet", Setup: "WPS + app" }, strengths: ["Easy coverage boost", "AP mode option"], limitation: "Halves throughput in pure extender mode" },
]

function toProduct(row: CatalogRow): MerchantProduct {
  const cost = row.cost ?? Math.round(row.price * (0.55 + (row.id.charCodeAt(1) % 20) / 100))
  const compatibleWith = row.compatible ?? []
  const compatibility: Record<string, Compatibility> = {}
  for (const id of compatibleWith) compatibility[id] = "confirmed"
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    kind: row.kind,
    priceCents: row.price,
    costCents: cost,
    stock: row.stock,
    imageUrl: photo(row.image),
    isSynthetic: true,
    specs: row.specs,
    strengths: row.strengths,
    limitation: row.limitation,
    compatibleWith,
    complementaryWith: compatibleWith,
    compatibility,
  }
}

export const products: MerchantProduct[] = rows.map(toProduct)

export const defaultRules: Rules = { minMarginPct: 20, maxDiscountPct: 15 }

export const bundle: Proposal = {
  id: "desk",
  name: "Remote work essentials",
  items: [{ productId: "w1", qty: 1 }, { productId: "w2", qty: 1 }, { productId: "w3", qty: 1 }],
  discountPct: 10,
  explanation: "A compact keyboard, a wireless mouse, and a USB-C hub. All three relationships are recorded in the demo compatibility graph; the hub still requires a suitable USB-C host.",
}

export const creatorBundle: Proposal = {
  id: "creator",
  name: "The creator starter kit",
  items: [{ productId: "c1", qty: 1 }, { productId: "c2", qty: 1 }, { productId: "c3", qty: 1 }],
  discountPct: 10,
  explanation: "USB audio, adjustable lighting, and a desk tripod. Demo relationships are recorded; check the microphone adapter before physical mounting.",
}

export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 ? 2 : 0 }).format(cents / 100)

export function compatibility(a: PublicProduct, b: PublicProduct) {
  return a.compatibleWith.includes(b.id) || b.compatibleWith.includes(a.id)
}

export function checkProposal(p: Proposal, rules: Rules, catalog = products): RuleCheck[] {
  const items = p.items.map(i => ({ product: catalog.find(p => p.id === i.productId), qty: i.qty }))
  const revenue = Math.round(items.reduce((s, i) => s + (i.product?.priceCents ?? 0) * i.qty, 0) * (1 - p.discountPct / 100))
  const cost = items.reduce((s, i) => s + (i.product?.costCents ?? 0) * i.qty, 0)
  const margin = revenue ? ((revenue - cost) / revenue) * 100 : 0
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
  return {
    id: `RZ-${1048 - i}`,
    request: ["Create a remote-work bundle", "Creator kit at 30% off", "Prepare workspace essentials", "Help with bundles", "A compact creator kit"][i],
    status,
    proposal,
    checks: checkProposal(proposal, defaultRules),
    createdAt: at,
    events: [{ step: "Catalog evaluation", status: status === "failed" ? "failed" : "ok", message: status === "failed" ? "Simulated provider failure" : "Evaluated demo inventory and policy", at }],
  }
})

export const orders = [
  { id: "D-01", productId: "a1", qty: 2 },
  { id: "D-02", productId: "w1", qty: 1 },
  { id: "D-03", productId: "m1", qty: 3 },
  { id: "D-04", productId: "a2", qty: 1 },
]
