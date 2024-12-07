const mongoose = require('mongoose');

const vendorSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true
  },
  alamat: String,
  kontak: String,
  email: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Vendor', vendorSchema); 