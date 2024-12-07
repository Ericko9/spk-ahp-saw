const Vendor = require('../models/Vendor');

// @desc    Get all vendors
// @route   GET /api/vendors
const getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create vendor
// @route   POST /api/vendors
const createVendor = async (req, res) => {
  try {
    const { nama, alamat, kontak, email } = req.body;
    const vendor = await Vendor.create({
      nama,
      alamat,
      kontak,
      email,
    });
    res.status(201).json(vendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update vendor
// @route   PUT /api/vendors/:id
const updateVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor tidak ditemukan' });
    }

    const updatedVendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedVendor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete vendor
// @route   DELETE /api/vendors/:id
const deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ message: 'Vendor tidak ditemukan' });
    }

    await vendor.remove();
    res.json({ message: 'Vendor berhasil dihapus' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVendors,
  createVendor,
  updateVendor,
  deleteVendor,
}; 