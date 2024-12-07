const mongoose = require('mongoose');

const kriteriaSchema = new mongoose.Schema({
  nama: {
    type: String,
    required: true,
    trim: true
  },
  bobot: {
    type: Number,
    default: 0
  },
  tipe: {
    type: String,
    required: true,
    enum: ['benefit', 'cost']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Kriteria', kriteriaSchema); 