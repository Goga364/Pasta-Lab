# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## 🚀 EC2 Auto-Deployment Script (User Data)

If you want to automatically set up this app on a new AWS EC2 instance (Ubuntu), paste the following script into the **"User Data"** section when launching your EC2 instance.

It will:

- Install Node.js, Nginx, and required tools
- Clone this GitHub repo
- Build the React app with Vite
- Configure Nginx with HTTPS (self-signed)
- Set up a reverse proxy to the Syrve API
- Serve the app at `https://<your-ec2-public-ip>`

<details>
<summary>Click to expand the full script</summary>

```bash
#!/bin/bash

set -e

# Update and install required packages
apt update -y
apt install -y nginx curl git unzip build-essential

# Install Node.js 20.x (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Clone your repo
cd /home/ubuntu
git clone https://github.com/tavassoliachi/Pasta-Lab.git
cd Pasta-Lab

# Install dependencies and build the Vite app
npm install
npm run build

# Create self-signed SSL cert
mkdir -p /etc/ssl/private /etc/ssl/certs
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/selfsigned.key \
  -out /etc/ssl/certs/selfsigned.crt \
  -subj "/CN=$(curl -s ifconfig.me)"

# Set permissions so Nginx can serve the files
chmod o+x /home /home/ubuntu /home/ubuntu/Pasta-Lab /home/ubuntu/Pasta-Lab/dist
chmod -R o+r /home/ubuntu/Pasta-Lab/dist

# Configure Nginx
cat > /etc/nginx/sites-available/default <<EOF
server {
    listen 443 ssl default_server;
    server_name _;

    ssl_certificate /etc/ssl/certs/selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/selfsigned.key;

    root /home/ubuntu/Pasta-Lab/dist;
    index index.html;

    location /proxy/ {
        proxy_pass https://api-eu.syrve.live/;
        proxy_set_header Host api-eu.syrve.live;
        proxy_ssl_verify off;
    }

    location / {
        try_files \$uri \$uri/ /index.html;
    }
}

server {
    listen 80 default_server;
    return 301 https://\$host\$request_uri;
}
EOF

# Restart Nginx
nginx -t && systemctl reload nginx

</details> ```
