import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import AdminLayout from '@/components/AdminLayout';
import axios from 'axios';
import { toast } from 'sonner';
import {
  Settings, Building, Receipt, CreditCard, Upload, Save,
  Loader2, Plus, Trash2, GripVertical, Eye, EyeOff, DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';
const API = `${BACKEND_URL}/api`;

const ERPSettings = () => {
  const { user, getAuthHeaders } = useApp();
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/erp/settings`, { headers: getAuthHeaders() });
      setSettings(res.data);
      if (res.data.company_logo) {
        setLogoPreview(res.data.company_logo);
      }
    } catch (e) {
      toast.error('Failed to load settings');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/erp/settings`, settings, { headers: getAuthHeaders() });

      // Also update general settings for company info
      await axios.put(`${API}/settings/admin`, {
        company_name: settings.company_name,
        company_address: settings.company_address,
        company_phone: settings.company_phone,
        company_email: settings.company_email,
        company_trn: settings.company_trn,
        vat_percentage: settings.vat_percentage
      }, { headers: getAuthHeaders() });

      toast.success('Settings saved successfully');
    } catch (e) {
      toast.error('Failed to save settings');
    }
    setSaving(false);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Logo must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        setSettings({ ...settings, company_logo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddColumn = () => {
    const newColumn = { key: `custom_${Date.now()}`, label: 'New Column', visible: true };
    setSettings({
      ...settings,
      invoice_columns: [...(settings.invoice_columns || []), newColumn]
    });
  };

  const handleRemoveColumn = (index) => {
    const columns = [...settings.invoice_columns];
    columns.splice(index, 1);
    setSettings({ ...settings, invoice_columns: columns });
  };

  const handleColumnChange = (index, field, value) => {
    const columns = [...settings.invoice_columns];
    columns[index] = { ...columns[index], [field]: value };
    setSettings({ ...settings, invoice_columns: columns });
  };

  if (loading || !settings) {
    return (
      <AdminLayout title="ERP Settings">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="ERP Settings" subtitle="Configure company, invoice, and payment settings">
      <div className="space-y-6">
        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-gold hover:bg-gold-dark text-navy-dark">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Settings
          </Button>
        </div>

        <Tabs defaultValue="storefront" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="storefront">Storefront</TabsTrigger>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="payment">Payment</TabsTrigger>
            <TabsTrigger value="bank">Bank Details</TabsTrigger>
          </TabsList>

          {/* Storefront Settings - Price Visibility & WhatsApp */}
          <TabsContent value="storefront">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-gold" />
                  Storefront Settings
                </CardTitle>
                <CardDescription>Control price visibility and contact options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Price Visibility Toggle */}
                <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div>
                    <Label className="text-base font-semibold">Show Prices on Website</Label>
                    <p className="text-sm text-muted-foreground">
                      When disabled, prices will be hidden and customers will need to request quotes
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium ${settings.show_prices ? 'text-green-600' : 'text-amber-600'}`}>
                      {settings.show_prices ? 'Prices Visible' : 'Quotation Mode'}
                    </span>
                    <Switch
                      checked={settings.show_prices ?? true}
                      onCheckedChange={(checked) => setSettings({ ...settings, show_prices: checked })}
                      data-testid="show-prices-toggle"
                    />
                  </div>
                </div>

                {!settings.show_prices && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                    <p className="text-sm text-amber-800 font-semibold flex items-center gap-2">
                      <EyeOff className="h-4 w-4" />
                      Quotation Mode Active
                    </p>
                    <div className="text-sm text-amber-700 space-y-2">
                      <p><strong>What customers will see:</strong></p>
                      <ul className="list-disc list-inside pl-2 space-y-1">
                        <li>Product pages show "Request Quote" instead of prices</li>
                        <li>Cart becomes "Inquiry List" without price totals</li>
                        <li>Checkout becomes "Request Quotation" form</li>
                      </ul>
                      <p className="pt-2"><strong>How it works:</strong></p>
                      <ul className="list-disc list-inside pl-2 space-y-1">
                        <li>Customer browses products and adds items to inquiry</li>
                        <li>Customer submits inquiry with contact details</li>
                        <li>You receive the inquiry in Admin Panel (Notifications)</li>
                        <li>You send the quotation with prices to customer's email</li>
                      </ul>
                    </div>
                    <p className="text-xs text-amber-600 pt-2 border-t border-amber-200">
                      💡 This is ideal for B2B businesses, custom pricing, or products requiring consultation.
                    </p>
                  </div>
                )}

                <Separator />

                {/* WhatsApp Number */}
                <div className="space-y-2">
                  <Label>WhatsApp Business Number</Label>
                  <Input
                    value={settings.whatsapp_number || ''}
                    onChange={(e) => setSettings({ ...settings, whatsapp_number: e.target.value })}
                    placeholder="+971 4 456 7890"
                    data-testid="whatsapp-number-input"
                  />
                  <p className="text-xs text-muted-foreground">This number will be used for the WhatsApp button on the website</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Settings */}
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-gold" />
                  Company Information
                </CardTitle>
                <CardDescription>Your business details for invoices and documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-6">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <Building className="h-12 w-12 text-gray-300" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <input
                        type="file"
                        id="logo-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                      <label htmlFor="logo-upload">
                        <Button variant="outline" className="cursor-pointer" asChild>
                          <span><Upload className="h-4 w-4 mr-2" /> Upload Logo</span>
                        </Button>
                      </label>
                      <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
                      {logoPreview && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                          onClick={() => {
                            setLogoPreview(null);
                            setSettings({ ...settings, company_logo: null });
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input
                      value={settings.company_name || ''}
                      onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT TRN (UAE)</Label>
                    <Input
                      value={settings.vat_trn || ''}
                      onChange={(e) => setSettings({ ...settings, vat_trn: e.target.value })}
                      placeholder="e.g., 100123456700003"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Company Address</Label>
                  <Textarea
                    value={settings.company_address || ''}
                    onChange={(e) => setSettings({ ...settings, company_address: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={settings.company_phone || ''}
                      onChange={(e) => setSettings({ ...settings, company_phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={settings.company_email || ''}
                      onChange={(e) => setSettings({ ...settings, company_email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <Input
                      value={settings.currency || 'AED'}
                      onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>VAT Percentage</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={settings.vat_percentage || 5}
                      onChange={(e) => setSettings({ ...settings, vat_percentage: parseFloat(e.target.value) || 5 })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoice Settings */}
          <TabsContent value="invoice">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-gold" />
                  Invoice Settings
                </CardTitle>
                <CardDescription>Customize invoice numbering and template</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Invoice Prefix</Label>
                    <Input
                      value={settings.invoice_prefix || 'INV-'}
                      onChange={(e) => setSettings({ ...settings, invoice_prefix: e.target.value })}
                      placeholder="e.g., INV-"
                    />
                    <p className="text-xs text-muted-foreground">Next invoice: {settings.invoice_prefix || 'INV-'}0001</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Starting Number</Label>
                    <Input
                      type="number"
                      value={settings.invoice_starting_number || 1}
                      onChange={(e) => setSettings({ ...settings, invoice_starting_number: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                </div>

                <Separator />

                {/* Customizable Invoice Columns */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">Invoice Item Columns</Label>
                      <p className="text-sm text-muted-foreground">Customize which columns appear on invoices</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={handleAddColumn}>
                      <Plus className="h-4 w-4 mr-1" /> Add Column
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {(settings.invoice_columns || []).map((column, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                        <Input
                          value={column.label}
                          onChange={(e) => handleColumnChange(index, 'label', e.target.value)}
                          className="flex-1"
                          placeholder="Column label"
                        />
                        <Input
                          value={column.key}
                          onChange={(e) => handleColumnChange(index, 'key', e.target.value)}
                          className="w-32"
                          placeholder="Key"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleColumnChange(index, 'visible', !column.visible)}
                        >
                          {column.visible ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-gray-400" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => handleRemoveColumn(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Invoice Footer Text</Label>
                  <Textarea
                    value={settings.invoice_footer_text || ''}
                    onChange={(e) => setSettings({ ...settings, invoice_footer_text: e.target.value })}
                    placeholder="Thank you for your business!"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Terms & Conditions</Label>
                  <Textarea
                    value={settings.invoice_terms || ''}
                    onChange={(e) => setSettings({ ...settings, invoice_terms: e.target.value })}
                    placeholder="Payment due within 30 days..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-gold" />
                  Payment Settings
                </CardTitle>
                <CardDescription>Configure payment methods and options</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-base">Online Payments</Label>
                    <p className="text-sm text-muted-foreground">Enable card payments via Stripe</p>
                  </div>
                  <Switch
                    checked={settings.payment_enabled ?? true}
                    onCheckedChange={(checked) => setSettings({ ...settings, payment_enabled: checked })}
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-base">Cash on Delivery (COD)</Label>
                    <p className="text-sm text-muted-foreground">Allow customers to pay on delivery</p>
                  </div>
                  <Switch
                    checked={settings.cod_enabled ?? true}
                    onCheckedChange={(checked) => setSettings({ ...settings, cod_enabled: checked })}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Available Payment Methods</Label>
                  <div className="flex flex-wrap gap-2">
                    {['card', 'cod', 'bank_transfer'].map((method) => (
                      <Badge
                        key={method}
                        variant="outline"
                        className={`cursor-pointer ${(settings.payment_methods || []).includes(method)
                          ? 'bg-gold/10 border-gold text-gold-dark'
                          : ''
                          }`}
                        onClick={() => {
                          const methods = settings.payment_methods || [];
                          if (methods.includes(method)) {
                            setSettings({ ...settings, payment_methods: methods.filter(m => m !== method) });
                          } else {
                            setSettings({ ...settings, payment_methods: [...methods, method] });
                          }
                        }}
                      >
                        {method === 'card' && <CreditCard className="h-3 w-3 mr-1" />}
                        {method === 'cod' && <DollarSign className="h-3 w-3 mr-1" />}
                        {method === 'bank_transfer' && <Building className="h-3 w-3 mr-1" />}
                        {method.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Details */}
          <TabsContent value="bank">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-gold" />
                  Bank Details
                </CardTitle>
                <CardDescription>Bank information displayed on invoices for bank transfer payments</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label className="text-base">Show Bank Details on Invoice</Label>
                    <p className="text-sm text-muted-foreground">Display bank account info for direct transfers</p>
                  </div>
                  <Switch
                    checked={settings.show_bank_details ?? false}
                    onCheckedChange={(checked) => setSettings({ ...settings, show_bank_details: checked })}
                  />
                </div>

                {settings.show_bank_details && (
                  <div className="space-y-4 pt-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Bank Name</Label>
                        <Input
                          value={settings.bank_details?.bank_name || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            bank_details: { ...settings.bank_details, bank_name: e.target.value }
                          })}
                          placeholder="e.g., Emirates NBD"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Account Name</Label>
                        <Input
                          value={settings.bank_details?.account_name || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            bank_details: { ...settings.bank_details, account_name: e.target.value }
                          })}
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Account Number</Label>
                        <Input
                          value={settings.bank_details?.account_number || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            bank_details: { ...settings.bank_details, account_number: e.target.value }
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>IBAN</Label>
                        <Input
                          value={settings.bank_details?.iban || ''}
                          onChange={(e) => setSettings({
                            ...settings,
                            bank_details: { ...settings.bank_details, iban: e.target.value }
                          })}
                          placeholder="e.g., AE07 0330 0000 0019 2810 1234"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>SWIFT Code</Label>
                      <Input
                        value={settings.bank_details?.swift_code || ''}
                        onChange={(e) => setSettings({
                          ...settings,
                          bank_details: { ...settings.bank_details, swift_code: e.target.value }
                        })}
                        placeholder="e.g., EABORXXX"
                        className="max-w-xs"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button at Bottom */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving} className="bg-gold hover:bg-gold-dark text-navy-dark">
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save All Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ERPSettings;
