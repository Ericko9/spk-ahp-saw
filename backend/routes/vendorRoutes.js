const express = require('express');
const router = express.Router();
const Vendor = require('../models/Vendor');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET semua vendor
router.get('/', async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST vendor baru
router.post('/', async (req, res) => {
  try {
    const { nama, alamat, kontak, email } = req.body;
    
    // Validasi input
    if (!nama || !alamat || !kontak || !email) {
      return res.status(400).json({ message: 'Semua field harus diisi' });
    }

    const vendor = new Vendor({
      nama,
      alamat,
      kontak,
      email
    });

    const newVendor = await vendor.save();
    res.status(201).json(newVendor);
  } catch (error) {
    console.error('Error saving vendor:', error); // Tambah log error
    res.status(400).json({ message: error.message });
  }
});

// PUT update vendor
router.put('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor tidak ditemukan' });
    }
    
    res.json(vendor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE vendor
router.delete('/:id', async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor tidak ditemukan' });
    }
    
    res.json({ message: 'Vendor berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 