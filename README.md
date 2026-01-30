# Grand Palace Landing Page - Deployment Guide

## 📦 Files Included

1. **index.html** - Main HTML file
2. **style.css** - Complete CSS styling
3. **script.js** - JavaScript functionality
4. **README.md** - This file

---

## 🚀 How to Deploy to cPanel

### Step 1: Access cPanel File Manager
1. Log in to your cPanel account
2. Navigate to **File Manager**
3. Go to the `public_html` folder (or your domain's root folder)

### Step 2: Upload Files
1. Click **Upload** button in File Manager
2. Upload all 3 files:
   - `index.html`
   - `style.css`
   - `script.js`
3. Make sure they are in the same directory

### Step 3: Set Permissions (if needed)
1. Right-click on each file
2. Select **Change Permissions**
3. Set to `644` (Read & Write for owner, Read for others)

### Step 4: Test Your Website
1. Open your browser
2. Go to: `http://yourdomain.com/index.html`
3. Or if uploaded to root: `http://yourdomain.com`

---

## 🎨 Customization Guide

### Change Colors
Open `style.css` and modify the CSS variables at the top:

```css
:root {
    --primary-blue: #1a3a52;    /* Main blue color */
    --primary-gold: #c9a961;    /* Main gold color */
    --gold-dark: #a88542;       /* Dark gold */
}
```

### Update Contact Information
Open `index.html` and find the contact section:

```html
<a href="tel:+971507072273">+971 507 072 273</a>
<a href="http://www.grandpalace.ae">www.grandpalace.ae</a>
<a href="http://www.gpstore.ae">www.gpstore.ae</a>
```

Replace with your actual phone number and website URLs.

### Add Your Logo Image
1. Upload your logo image to cPanel (e.g., `logo.png`)
2. In `index.html`, replace the emoji logo with:

```html
<div class="logo">
    <img src="logo.png" alt="Grand Palace Logo" style="width: 100%; height: 100%; object-fit: contain;">
</div>
```

### Add Brand Logo Images
1. Create a folder called `images` in cPanel
2. Upload brand logo images (e.g., `jaquar.png`, `osram.png`, etc.)
3. In `index.html`, replace brand text with images:

```html
<div class="brand-item">
    <img src="images/jaquar.png" alt="Jaquar">
</div>
```

---

## 📱 Features Included

✅ **Fully Responsive** - Works on mobile, tablet, and desktop
✅ **Smooth Animations** - Professional scroll and hover effects
✅ **SEO Optimized** - Meta tags and semantic HTML
✅ **Fast Loading** - Optimized CSS and JavaScript
✅ **Brand Colors** - Matches Grand Palace brand guidelines
✅ **Arabic Support** - Proper RTL text rendering
✅ **Contact Links** - Clickable phone and website links
✅ **Scroll to Top** - Automatic scroll-to-top button

---

## 🔧 Browser Compatibility

✅ Chrome (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Edge (latest)
✅ Mobile browsers (iOS Safari, Chrome Mobile)

---

## 📊 Performance Tips

1. **Enable Gzip Compression** in cPanel
   - Go to **Software** → **Optimize Website**
   - Select "Compress All Content"

2. **Enable Browser Caching**
   - Add this to your `.htaccess` file:
   ```apache
   <IfModule mod_expires.c>
       ExpiresActive On
       ExpiresByType text/css "access plus 1 year"
       ExpiresByType application/javascript "access plus 1 year"
       ExpiresByType image/png "access plus 1 year"
   </IfModule>
   ```

3. **Use a CDN** (Optional)
   - Consider using Cloudflare for faster global delivery

---

## 🎯 Next Steps (Optional Enhancements)

### Add Google Analytics
Add this code before `</head>` in `index.html`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=YOUR-GA-ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR-GA-ID');
</script>
```

### Add Contact Form
You can add a contact form using:
- **Formspree** (https://formspree.io) - Free and easy
- **Google Forms** - Embed a Google Form
- **cPanel Email Forms** - Use cPanel's built-in form handler

### Add WhatsApp Chat Button
Add this before `</body>` in `index.html`:

```html
<a href="https://wa.me/971507072273" class="whatsapp-float" target="_blank">
    <i class="fa fa-whatsapp"></i>
</a>
```

And add this CSS to `style.css`:

```css
.whatsapp-float {
    position: fixed;
    width: 60px;
    height: 60px;
    bottom: 100px;
    right: 30px;
    background-color: #25d366;
    color: #FFF;
    border-radius: 50px;
    text-align: center;
    font-size: 30px;
    box-shadow: 2px 2px 3px #999;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
}
```

---

## 🐛 Troubleshooting

### Issue: Page shows blank
**Solution:** Make sure all 3 files are in the same folder

### Issue: Styles not loading
**Solution:** Check that `style.css` is in the same directory as `index.html`

### Issue: Arabic text not showing correctly
**Solution:** Make sure your server supports UTF-8 encoding

### Issue: Phone link not working on mobile
**Solution:** Make sure the link format is `tel:+971507072273` (no spaces)

---

## 📞 Support

For any issues or customization requests, contact your web developer.

---

## 📄 License

© 2026 Grand Palace General Trading L.L.C. All rights reserved.

---

**Developed with ❤️ for Grand Palace**
