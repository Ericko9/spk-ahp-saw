const mongoose = require('mongoose');

const penilaianSchema = new mongoose.Schema({
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vendor',
    required: true
  },
  periode: {
    type: Date,
    required: true
  },
  nilai: [{
    kriteria: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Kriteria',
      required: true
    },
    nilai: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  }],
  nilaiAkhir: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Penilaian', penilaianSchema);