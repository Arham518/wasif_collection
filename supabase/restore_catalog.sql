-- Rana Collection: bring back the original catalogue products (optional)
--
-- Why: the products table now only has the 2 products added on 9 Oct 2026; the earlier
-- 28 catalogue products (photos in client/public/products/*.webp) were deleted from
-- Supabase, so the site no longer shows those pictures.
--
-- What it does: inserts each original product again UNLESS a product with the same name
-- already exists. Original codes (p001...) are kept where free; if a code is already used by a
-- new product, the original gets the next free code (p029, p030, ...). Existing products are
-- never changed or deleted. Photos point at the live site's /products/ files (the website
-- serves them from its own build; the WhatsApp bot can send them as links).
--
-- Run in Supabase > SQL Editor only if you want the old catalogue back. Safe to run again.

with seed as (
  select e as j, ord from jsonb_array_elements($seed$[
 {
  "code": "p001",
  "name": "Olive Embroidered Lawn 3PC",
  "brand": "Khaadi",
  "category": "Lawn",
  "subcategory": "Unstitched 3PC",
  "price": 4490,
  "color": "Olive",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "lawn",
   "embroidered"
  ],
  "description": "Olive printed lawn three-piece with embroidered neckline and dupatta.",
  "images": [
   "https://wasifcloth.netlify.app/products/w01.webp",
   "https://wasifcloth.netlify.app/products/w07.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w01.webp",
  "stock": 18,
  "featured": true,
  "rating": 4.7,
  "reviews": 24,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p002",
  "name": "Navy Embroidered Pret Suit",
  "brand": "Gul Ahmed",
  "category": "Pret",
  "subcategory": "Ready to Wear",
  "price": 5590,
  "color": "Navy",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "pret",
   "embroidered"
  ],
  "description": "Navy embroidered pret with flowing dupatta.",
  "images": [
   "https://wasifcloth.netlify.app/products/w02.webp",
   "https://wasifcloth.netlify.app/products/w12.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w02.webp",
  "stock": 14,
  "featured": true,
  "rating": 4.8,
  "reviews": 31,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p003",
  "name": "Sage Printed Lawn Suit",
  "brand": "Bonanza Satrangi",
  "category": "Lawn",
  "subcategory": "Unstitched 3PC",
  "price": 3690,
  "color": "Sage",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "lawn",
   "print"
  ],
  "description": "Light sage lawn with purple accents and matching trousers.",
  "images": [
   "https://wasifcloth.netlify.app/products/w03.webp",
   "https://wasifcloth.netlify.app/products/w01.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w03.webp",
  "stock": 22,
  "featured": true,
  "rating": 4.5,
  "reviews": 18,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p004",
  "name": "Ivory Floral Kurti Set",
  "brand": "Sana Safinaz",
  "category": "Pret",
  "subcategory": "Kurti",
  "price": 4890,
  "color": "Ivory",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "kurti",
   "floral"
  ],
  "description": "Ivory floral kurti with maroon motifs and dupatta.",
  "images": [
   "https://wasifcloth.netlify.app/products/w04.webp",
   "https://wasifcloth.netlify.app/products/w05.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w04.webp",
  "stock": 16,
  "featured": true,
  "rating": 4.6,
  "reviews": 22,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p005",
  "name": "Peach Printed Kurti",
  "brand": "Sapphire",
  "category": "Pret",
  "subcategory": "Kurti",
  "price": 3290,
  "color": "Peach",
  "fabric": "Cotton",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "kurti",
   "pret"
  ],
  "description": "Peach printed kurti with puff sleeves for everyday wear.",
  "images": [
   "https://wasifcloth.netlify.app/products/w05.webp",
   "https://wasifcloth.netlify.app/products/w04.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w05.webp",
  "stock": 20,
  "featured": false,
  "rating": 4.4,
  "reviews": 12,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p006",
  "name": "Mustard Embroidered Suit",
  "brand": "Alkaram",
  "category": "Lawn",
  "subcategory": "Ready to Wear",
  "price": 4190,
  "color": "Mustard",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "lawn",
   "mustard"
  ],
  "description": "Mustard yellow embroidered suit with printed dupatta.",
  "images": [
   "https://wasifcloth.netlify.app/products/w06.webp",
   "https://wasifcloth.netlify.app/products/w10.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w06.webp",
  "stock": 15,
  "featured": true,
  "rating": 4.7,
  "reviews": 19,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p007",
  "name": "Mint Border Lawn 3PC",
  "brand": "Khaadi",
  "category": "Lawn",
  "subcategory": "Unstitched 3PC",
  "price": 4290,
  "color": "Mint",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "lawn",
   "mint"
  ],
  "description": "Mint green lawn with decorative borders and dupatta.",
  "images": [
   "https://wasifcloth.netlify.app/products/w07.webp",
   "https://wasifcloth.netlify.app/products/w03.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w07.webp",
  "stock": 17,
  "featured": false,
  "rating": 4.5,
  "reviews": 15,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p008",
  "name": "Teal Printed Shalwar Kameez",
  "brand": "Gul Ahmed",
  "category": "Pret",
  "subcategory": "Ready to Wear",
  "price": 5290,
  "color": "Teal",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "pret",
   "teal"
  ],
  "description": "Teal printed shalwar kameez with orange motifs.",
  "images": [
   "https://wasifcloth.netlify.app/products/w08.webp",
   "https://wasifcloth.netlify.app/products/w12.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w08.webp",
  "stock": 13,
  "featured": true,
  "rating": 4.8,
  "reviews": 27,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p009",
  "name": "Ivory Formal Lehenga Set",
  "brand": "Sana Safinaz",
  "category": "Formal",
  "subcategory": "Party Wear",
  "price": 14990,
  "color": "Ivory",
  "fabric": "Organza Blend",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "formal",
   "lehenga"
  ],
  "description": "Ivory embroidered formal set for festive occasions.",
  "images": [
   "https://wasifcloth.netlify.app/products/w09.webp",
   "https://wasifcloth.netlify.app/products/w13.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w09.webp",
  "stock": 8,
  "featured": true,
  "rating": 4.9,
  "reviews": 11,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p010",
  "name": "Dusty Rose Cutwork Suit",
  "brand": "J.",
  "category": "Pret",
  "subcategory": "Ready to Wear",
  "price": 4590,
  "color": "Rose",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "pret",
   "rose"
  ],
  "description": "Dusty rose pret with cutwork hem and matching dupatta.",
  "images": [
   "https://wasifcloth.netlify.app/products/w10.webp",
   "https://wasifcloth.netlify.app/products/w06.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w10.webp",
  "stock": 14,
  "featured": false,
  "rating": 4.6,
  "reviews": 16,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p011",
  "name": "Turquoise Floral Pret",
  "brand": "Sapphire",
  "category": "Pret",
  "subcategory": "Ready to Wear",
  "price": 3990,
  "color": "Turquoise",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "pret",
   "floral"
  ],
  "description": "Turquoise floral pret with embroidered cuffs.",
  "images": [
   "https://wasifcloth.netlify.app/products/w11.webp",
   "https://wasifcloth.netlify.app/products/w02.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w11.webp",
  "stock": 19,
  "featured": false,
  "rating": 4.4,
  "reviews": 14,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p012",
  "name": "Navy Border Dupatta Edit",
  "brand": "Bonanza Satrangi",
  "category": "Lawn",
  "subcategory": "Unstitched 3PC",
  "price": 3490,
  "color": "Navy",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "lawn",
   "navy"
  ],
  "description": "Navy lawn look with floral border and draped dupatta.",
  "images": [
   "https://wasifcloth.netlify.app/products/w12.webp",
   "https://wasifcloth.netlify.app/products/w08.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w12.webp",
  "stock": 21,
  "featured": false,
  "rating": 4.3,
  "reviews": 9,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p013",
  "name": "Magenta Dupatta Statement",
  "brand": "Khaadi",
  "category": "Formal",
  "subcategory": "Party Wear",
  "price": 8990,
  "color": "Magenta",
  "fabric": "Chiffon Blend",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "formal",
   "dupatta"
  ],
  "description": "Statement magenta patterned dupatta over dark base.",
  "images": [
   "https://wasifcloth.netlify.app/products/w13.webp",
   "https://wasifcloth.netlify.app/products/w09.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w13.webp",
  "stock": 10,
  "featured": false,
  "rating": 4.7,
  "reviews": 8,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p014",
  "name": "Lavender Embroidered Kurti",
  "brand": "Alkaram",
  "category": "Pret",
  "subcategory": "Kurti",
  "price": 3790,
  "color": "Lavender",
  "fabric": "Cotton",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "kurti",
   "lavender"
  ],
  "description": "Lavender kurti with mirror-work panel and printed sleeves.",
  "images": [
   "https://wasifcloth.netlify.app/products/w14.webp",
   "https://wasifcloth.netlify.app/products/w07.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w14.webp",
  "stock": 18,
  "featured": false,
  "rating": 4.5,
  "reviews": 13,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p015",
  "name": "Olive Everyday Lawn",
  "brand": "Bonanza Satrangi",
  "category": "Lawn",
  "subcategory": "Unstitched 2PC",
  "price": 2990,
  "color": "Olive",
  "fabric": "Lawn",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "lawn",
   "everyday"
  ],
  "description": "Everyday olive lawn look for casual wear.",
  "images": [
   "https://wasifcloth.netlify.app/products/w01.webp",
   "https://wasifcloth.netlify.app/products/w03.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w01.webp",
  "stock": 25,
  "featured": false,
  "rating": 4.2,
  "reviews": 20,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p016",
  "name": "Peach Daywear Kurti",
  "brand": "J.",
  "category": "Pret",
  "subcategory": "Kurti",
  "price": 2890,
  "color": "Peach",
  "fabric": "Cotton",
  "gender": "women",
  "sizes": [
   "XS",
   "S",
   "M",
   "L",
   "XL"
  ],
  "tags": [
   "kurti",
   "daywear"
  ],
  "description": "Soft peach daywear kurti with print.",
  "images": [
   "https://wasifcloth.netlify.app/products/w05.webp",
   "https://wasifcloth.netlify.app/products/w11.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/w05.webp",
  "stock": 23,
  "featured": false,
  "rating": 4.3,
  "reviews": 17,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p017",
  "name": "Navy Classic Kurta Shalwar",
  "brand": "J.",
  "category": "Ethnic",
  "subcategory": "Shalwar Kameez",
  "price": 4490,
  "color": "Navy",
  "fabric": "Cotton",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "kurta",
   "navy"
  ],
  "description": "Classic navy kurta shalwar for Eid and gatherings.",
  "images": [
   "https://wasifcloth.netlify.app/products/m01.webp",
   "https://wasifcloth.netlify.app/products/m02.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m01.webp",
  "stock": 20,
  "featured": true,
  "rating": 4.7,
  "reviews": 28,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p018",
  "name": "Navy Kurta — Side Pose",
  "brand": "J.",
  "category": "Ethnic",
  "subcategory": "Kurta",
  "price": 3990,
  "color": "Navy",
  "fabric": "Cotton",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "kurta"
  ],
  "description": "Navy cotton kurta with mandarin collar.",
  "images": [
   "https://wasifcloth.netlify.app/products/m02.webp",
   "https://wasifcloth.netlify.app/products/m01.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m02.webp",
  "stock": 18,
  "featured": false,
  "rating": 4.6,
  "reviews": 15,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p019",
  "name": "White & Sage Kurta Pair Look",
  "brand": "Gul Ahmed",
  "category": "Ethnic",
  "subcategory": "Shalwar Kameez",
  "price": 5290,
  "color": "Ivory",
  "fabric": "Cotton",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "kurta",
   "white"
  ],
  "description": "Clean ivory/sage kurta shalwar styling for family events.",
  "images": [
   "https://wasifcloth.netlify.app/products/m03.webp",
   "https://wasifcloth.netlify.app/products/m01.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m03.webp",
  "stock": 16,
  "featured": true,
  "rating": 4.8,
  "reviews": 21,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p020",
  "name": "Formal Waistcoat Set",
  "brand": "J.",
  "category": "Ethnic",
  "subcategory": "Waistcoat",
  "price": 8990,
  "color": "Ivory",
  "fabric": "Wash & Wear",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "waistcoat",
   "formal"
  ],
  "description": "Structured waistcoat over dark kurta — wedding ready.",
  "images": [
   "https://wasifcloth.netlify.app/products/m04.webp",
   "https://wasifcloth.netlify.app/products/m05.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m04.webp",
  "stock": 12,
  "featured": true,
  "rating": 4.9,
  "reviews": 14,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p021",
  "name": "Textured Waistcoat Look",
  "brand": "Khaadi",
  "category": "Ethnic",
  "subcategory": "Waistcoat",
  "price": 7490,
  "color": "Grey",
  "fabric": "Raw Silk Blend",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "waistcoat"
  ],
  "description": "Textured waistcoat with pocket square detail.",
  "images": [
   "https://wasifcloth.netlify.app/products/m05.webp",
   "https://wasifcloth.netlify.app/products/m04.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m05.webp",
  "stock": 11,
  "featured": false,
  "rating": 4.7,
  "reviews": 10,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p022",
  "name": "Kurta with Traditional Shawl",
  "brand": "Alkaram",
  "category": "Ethnic",
  "subcategory": "Kurta",
  "price": 5990,
  "color": "Black",
  "fabric": "Cotton",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "kurta",
   "shawl"
  ],
  "description": "Dark kurta styled with traditional white shawl.",
  "images": [
   "https://wasifcloth.netlify.app/products/m06.webp",
   "https://wasifcloth.netlify.app/products/m04.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m06.webp",
  "stock": 14,
  "featured": true,
  "rating": 4.6,
  "reviews": 12,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p023",
  "name": "Everyday Navy Kurta",
  "brand": "Bonanza Satrangi",
  "category": "Ethnic",
  "subcategory": "Kurta",
  "price": 3290,
  "color": "Navy",
  "fabric": "Cotton",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "kurta",
   "everyday"
  ],
  "description": "Affordable everyday navy kurta.",
  "images": [
   "https://wasifcloth.netlify.app/products/m01.webp",
   "https://wasifcloth.netlify.app/products/m03.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m01.webp",
  "stock": 24,
  "featured": false,
  "rating": 4.3,
  "reviews": 19,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p024",
  "name": "Ivory Kurta Classic",
  "brand": "Sapphire",
  "category": "Ethnic",
  "subcategory": "Kurta",
  "price": 3790,
  "color": "Ivory",
  "fabric": "Cotton",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "kurta",
   "ivory"
  ],
  "description": "Classic ivory kurta for casual and formal mix.",
  "images": [
   "https://wasifcloth.netlify.app/products/m03.webp",
   "https://wasifcloth.netlify.app/products/m02.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m03.webp",
  "stock": 17,
  "featured": false,
  "rating": 4.4,
  "reviews": 11,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p025",
  "name": "Eid Waistcoat Ensemble",
  "brand": "J.",
  "category": "Ethnic",
  "subcategory": "Waistcoat",
  "price": 9990,
  "color": "Black",
  "fabric": "Jamawar Blend",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "waistcoat",
   "eid"
  ],
  "description": "Eid-ready waistcoat ensemble.",
  "images": [
   "https://wasifcloth.netlify.app/products/m04.webp",
   "https://wasifcloth.netlify.app/products/m06.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m04.webp",
  "stock": 9,
  "featured": false,
  "rating": 4.8,
  "reviews": 7,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p026",
  "name": "Shawl Style Kurta",
  "brand": "Gul Ahmed",
  "category": "Ethnic",
  "subcategory": "Kurta",
  "price": 5490,
  "color": "Black",
  "fabric": "Cotton",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "kurta",
   "shawl"
  ],
  "description": "Kurta with draped shawl for winter evenings.",
  "images": [
   "https://wasifcloth.netlify.app/products/m06.webp",
   "https://wasifcloth.netlify.app/products/m05.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m06.webp",
  "stock": 13,
  "featured": false,
  "rating": 4.5,
  "reviews": 9,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p027",
  "name": "Cotton Kurta Shalwar Navy",
  "brand": "Alkaram",
  "category": "Ethnic",
  "subcategory": "Shalwar Kameez",
  "price": 4190,
  "color": "Navy",
  "fabric": "Cotton",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "shalwar kameez"
  ],
  "description": "Comfort cotton navy shalwar kameez.",
  "images": [
   "https://wasifcloth.netlify.app/products/m02.webp",
   "https://wasifcloth.netlify.app/products/m03.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m02.webp",
  "stock": 20,
  "featured": false,
  "rating": 4.4,
  "reviews": 16,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 },
 {
  "code": "p028",
  "name": "Premium Waistcoat Cut",
  "brand": "Khaadi",
  "category": "Ethnic",
  "subcategory": "Waistcoat",
  "price": 8490,
  "color": "Ivory",
  "fabric": "Raw Silk",
  "gender": "men",
  "sizes": [
   "S",
   "M",
   "L",
   "XL",
   "XXL"
  ],
  "tags": [
   "waistcoat",
   "premium"
  ],
  "description": "Premium waistcoat cut for formal events.",
  "images": [
   "https://wasifcloth.netlify.app/products/m05.webp",
   "https://wasifcloth.netlify.app/products/m01.webp"
  ],
  "images360": [],
  "image_url": "https://wasifcloth.netlify.app/products/m05.webp",
  "stock": 10,
  "featured": false,
  "rating": 4.7,
  "reviews": 8,
  "price_note": "Sample price — typical market range",
  "active": true,
  "is_active": true
 }
]$seed$::jsonb) with ordinality as t(e, ord)
),
todo as (
  select s.* from seed s
  where not exists (select 1 from public.products p where lower(trim(p.name)) = lower(trim(s.j->>'name')))
),
mx as (
  select greatest(
    coalesce((select max(substring(code from '^p(\d+)$')::int) from public.products), 0),
    28
  ) as m
),
coded as (
  select t.j, t.ord,
         case when exists (select 1 from public.products p where p.code = t.j->>'code') then null else t.j->>'code' end as keep
  from todo t
),
final as (
  select c.ord,
         c.j || jsonb_build_object('code', coalesce(c.keep,
           'p' || lpad((mx.m + row_number() over (partition by (c.keep is null) order by c.ord))::text, 3, '0'))) as j
  from coded c cross join mx
)
insert into public.products
  (code, name, brand, category, subcategory, price, color, fabric, gender, sizes, tags, description,
   images, images360, image_url, stock, featured, rating, reviews, price_note, active, is_active)
select r.code, r.name, r.brand, r.category, r.subcategory, r.price, r.color, r.fabric, r.gender, r.sizes, r.tags, r.description,
       r.images, r.images360, r.image_url, r.stock, r.featured, r.rating, r.reviews, r.price_note, r.active, r.is_active
from final f
cross join lateral jsonb_populate_record(null::public.products, f.j) as r
order by f.ord;

select code, name, gender from public.products order by id;
