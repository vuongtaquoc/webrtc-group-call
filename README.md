# webrtc-group-call
___
# Getting Started
## Dependencies
What you need to run this app:

* `kurento-media-server`
```bash
# For Ubuntu 14.04 LTS (64 bits)
echo "deb http://ubuntu.kurento.org trusty kms6" | sudo tee /etc/apt/sources.list.d/kurento.list
wget -O - http://ubuntu.kurento.org/kurento.gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install kurento-media-server-6.0
```

```bash
# For Ubuntu 16.04 LTS (64 bits)
echo "deb http://ubuntu.kurento.org xenial kms6" | sudo tee /etc/apt/sources.list.d/kurento.list
wget -O - http://ubuntu.kurento.org/kurento.gpg.key | sudo apt-key add -
sudo apt-get update
sudo apt-get install kurento-media-server-6.0
```

```bash
# Start and stop media server
sudo service kurento-media-server-6.0 start
sudo service kurento-media-server-6.0 stop
```

See more [Installation guide](http://doc-kurento.readthedocs.io/en/stable/installation_guide.html)

* `node` and `npm` ([How To Install Node.js on Ubuntu 16.04](https://www.digitalocean.com/community/tutorials/how-to-install-node-js-on-ubuntu-16-04))
* Ensure you're running the latest versions Node `v6.x.x`+ (or `v7.x.x`) and NPM `3.x.x`+

## Running the app
```bash
# Install dependencies
npm run get

# Run app
node index.js
```
