const { useState, useEffect, useMemo, useCallback } = React;

// Importar funciones de Firebase desde los objetos globales
const {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    setDoc,
    onSnapshot,
    serverTimestamp
} = window.firebaseFirestore;

const {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} = window.firebaseAuthFunctions;

// ================== FUNCIÓN PARA GENERAR IDs ÚNICOS ==================
const generateUniqueId = (prefix = '') => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substr(2, 9);
    const uniqueId = `${prefix}${timestamp}-${randomStr}`.toUpperCase();
    return uniqueId;
};

// ================== COMPONENTE PARA ICONOS ==================
const Icon = ({ name, size = 24, className = '', ...props }) => {
    return React.createElement('i', {
        'data-lucide': name,
        className: `lucide lucide-${name} ${className}`,
        style: { width: size, height: size },
        ...props
    });
};

// ================== COMPONENTE SEPARADO PARA FORMULARIO ==================
const ProductForm = ({ 
    formData, 
    setFormData, 
    darkMode, 
    handleSubmit, 
    editingProduct, 
    setShowForm, 
    setEditingProduct, 
    user, 
    categories 
}) => {
    const [localFormData, setLocalFormData] = useState(formData);
    
    useEffect(() => {
        setLocalFormData(formData);
    }, [formData]);
    
    const handleChange = (field, value) => {
        setLocalFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    const syncWithParent = () => {
        setFormData(localFormData);
    };
    
    const isFormValid = useMemo(() => {
        return (
            localFormData.name.trim() !== '' &&
            localFormData.quantity !== '' &&
            !isNaN(localFormData.quantity) &&
            parseInt(localFormData.quantity) >= 0 &&
            localFormData.price !== '' &&
            !isNaN(localFormData.price) &&
            parseFloat(localFormData.price) > 0 &&
            localFormData.minStock !== '' &&
            !isNaN(localFormData.minStock) &&
            parseInt(localFormData.minStock) >= 0 &&
            localFormData.supplier.trim() !== ''
        );
    }, [localFormData]);
    
    const totalValue = useMemo(() => {
        const quantity = parseInt(localFormData.quantity) || 0;
        const price = parseFloat(localFormData.price) || 0;
        return quantity * price;
    }, [localFormData.quantity, localFormData.price]);
    
    const cardBg = darkMode ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-br from-white to-blue-50 border-blue-100';
    const inputBg = darkMode ? 'bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
    
    const handleLocalSubmit = () => {
        setFormData(localFormData);
        handleSubmit();
    };
    
    const handleCancel = () => {
        setShowForm(false);
        setEditingProduct(null);
        setFormData({ 
            name: '', 
            category: 'Electrónica', 
            quantity: '', 
            price: '', 
            minStock: '', 
            supplier: '', 
            description: '' 
        });
    };
    
    return (
        <div className={`${cardBg} rounded-2xl p-6 shadow-2xl border-2 animate-fade-in`}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                        <Icon name={editingProduct ? "edit-2" : "plus"} size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {editingProduct ? 'Modifica los datos del producto' : 'Completa la información del producto'}
                        </p>
                    </div>
                </div>
                
                {totalValue > 0 && (
                    <div className={`px-4 py-2 rounded-xl ${
                        darkMode ? 'bg-gradient-to-r from-green-900/30 to-emerald-900/20' : 'bg-gradient-to-r from-green-50 to-emerald-50'
                    } border ${darkMode ? 'border-emerald-700' : 'border-emerald-200'}`}>
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Valor Total:</span>
                        <span className="ml-2 text-lg font-bold text-emerald-600 dark:text-emerald-400">${totalValue.toLocaleString()}</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nombre del Producto */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Icon name="tag" size={16} className="text-blue-500" />
                        <span>Nombre del Producto</span>
                        <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ej: MacBook Pro M3 16&quot;"
                        value={localFormData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        onBlur={syncWithParent}
                        className={`${inputBg} w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                            localFormData.name.trim() === '' ? 'border-red-300 dark:border-red-500' : 'border-green-300 dark:border-green-500'
                        }`}
                        autoFocus
                    />
                </div>
                
                {/* Categoría */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Icon name="grid" size={16} className="text-purple-500" />
                        <span>Categoría</span>
                        <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <select
                            value={localFormData.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            onBlur={syncWithParent}
                            className={`${inputBg} w-full px-10 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-600 font-medium appearance-none`}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                        <Icon name="chevron-down" size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                </div>

                {/* Cantidad en Stock */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Icon name="package" size={16} className="text-amber-500" />
                        <span>Cantidad en Stock</span>
                        <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        placeholder="0"
                        value={localFormData.quantity}
                        onChange={(e) => handleChange('quantity', e.target.value)}
                        onBlur={syncWithParent}
                        className={`${inputBg} w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                            localFormData.quantity === '' || isNaN(localFormData.quantity) || parseInt(localFormData.quantity) < 0 
                                ? 'border-red-300 dark:border-red-500' 
                                : 'border-green-300 dark:border-green-500'
                        }`}
                        min="0"
                    />
                </div>

             {/* Precio Unitario */}
<div className="space-y-2">
    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
        <Icon name="dollar-sign" size={16} className="text-emerald-500" />
        <span>Precio Unitario</span>
        <span className="text-red-500">*</span>
    </label>

    <div className="relative">
        <Icon
            name="dollar-sign"
            size={18}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 text-emerald-500"
        />

        <input
            type="text"
            placeholder="0.00"
            value={
                localFormData.price
                    ? Number(localFormData.price).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                      })
                    : ""
            }
            onChange={(e) => {
                // Quitar comas antes de guardar
                const raw = e.target.value.replace(/,/g, '');

                // Permitir solo números y punto
                if (!/^\d*\.?\d*$/.test(raw)) return;

                handleChange("price", raw);
            }}
            onBlur={syncWithParent}
            className={`${inputBg} w-full pl-12 pr-4 py-3 rounded-xl border-2 font-medium ${
                !localFormData.price || isNaN(localFormData.price) || parseFloat(localFormData.price) <= 0
                    ? "border-red-300 dark:border-red-500"
                    : "border-green-300 dark:border-green-500"
            }`}
        />
    </div>
</div>

                {/* Stock Mínimo */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Icon name="alert-circle" size={16} className="text-orange-500" />
                        <span>Stock Mínimo</span>
                        <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        placeholder="0"
                        value={localFormData.minStock}
                        onChange={(e) => handleChange('minStock', e.target.value)}
                        onBlur={syncWithParent}
                        className={`${inputBg} w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                            localFormData.minStock === '' || isNaN(localFormData.minStock) || parseInt(localFormData.minStock) < 0 
                                ? 'border-red-300 dark:border-red-500' 
                                : 'border-green-300 dark:border-green-500'
                        }`}
                        min="0"
                    />
                </div>

                {/* Proveedor */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Icon name="truck" size={16} className="text-cyan-500" />
                        <span>Proveedor</span>
                        <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        placeholder="Ej: Apple Store"
                        value={localFormData.supplier}
                        onChange={(e) => handleChange('supplier', e.target.value)}
                        onBlur={syncWithParent}
                        className={`${inputBg} w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 font-medium ${
                            localFormData.supplier.trim() === '' ? 'border-red-300 dark:border-red-500' : 'border-green-300 dark:border-green-500'
                        }`}
                    />
                </div>

                {/* Descripción */}
                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Icon name="file-text" size={16} className="text-indigo-500" />
                        <span>Descripción (Opcional)</span>
                    </label>
                    <textarea
                        placeholder="Descripción detallada del producto, características, especificaciones técnicas..."
                        value={localFormData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                        onBlur={syncWithParent}
                        className={`${inputBg} w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-600 resize-none font-medium transition-all duration-200 focus:ring-2 focus:ring-blue-500/20`}
                        rows="3"
                    />
                </div>

                {/* Botones de acción */}
                <div className="md:col-span-2 flex gap-3 mt-2">
                    <button
                        onClick={handleLocalSubmit}
                        disabled={!isFormValid}
                        className={`flex-1 px-6 py-4 rounded-xl shadow-lg font-semibold text-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                            isFormValid 
                                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 hover:shadow-emerald-500/25' 
                                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        } flex items-center justify-center gap-3`}
                    >
                        <Icon name={editingProduct ? "check-circle" : "save"} size={22} />
                        {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                    </button>
                    <button
                        onClick={handleCancel}
                        className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 ${
                            darkMode 
                                ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-300 border border-gray-600' 
                                : 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 border border-gray-300'
                        }`}
                    >
                        <Icon name="x" size={22} />
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

const InventoryManagementSystem = () => {
    const [products, setProducts] = useState([]);
    const [darkMode, setDarkMode] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [filterCategory, setFilterCategory] = useState('all');
    const [activeTab, setActiveTab] = useState('caja');
    const [notification, setNotification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [sales, setSales] = useState([]);
    const [currentSale, setCurrentSale] = useState([]);
    const [showSaleModal, setShowSaleModal] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        category: 'Electrónica',
        quantity: '',
        price: '',
        minStock: '',
        supplier: '',
        description: ''
    });

    const categories = ['Electrónica', 'Alimentos', 'Ropa', 'Hogar', 'Deportes', 'Salud', 'Belleza', 'Otros'];
    
    // ================== FUNCIONES DE NOTIFICACIÓN ==================
    const showNotification = useCallback((message, type = 'success') => {
        setNotification({ message, type, id: Date.now() });
        setTimeout(() => setNotification(null), 3000);
    }, []);

    // ================== MODO OSCURO AUTOMÁTICO MEJORADO ==================
    useEffect(() => {
        const updateDarkMode = () => {
            const hour = new Date().getHours();
            const savedDarkMode = localStorage.getItem('darkMode');
            
            if (savedDarkMode !== null) {
                setDarkMode(savedDarkMode === 'true');
            } else {
                // Modo automático: oscuro de 19:00 a 7:00
                const isNightTime = hour >= 19 || hour < 7;
                setDarkMode(isNightTime);
            }
        };

        updateDarkMode();
        
        // Verificar cada minuto para cambios automáticos
        const interval = setInterval(updateDarkMode, 60000);
        
        // Escuchar cambios en la configuración del sistema
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = (e) => {
                const savedDarkMode = localStorage.getItem('darkMode');
                if (savedDarkMode === null) {
                    setDarkMode(e.matches);
                }
            };
            
            mediaQuery.addEventListener('change', handleChange);
            return () => {
                mediaQuery.removeEventListener('change', handleChange);
                clearInterval(interval);
            };
        }
        
        return () => clearInterval(interval);
    }, []);

    // Guardar preferencia cuando el usuario cambie manualmente el modo oscuro
    useEffect(() => {
        localStorage.setItem('darkMode', darkMode.toString());
    }, [darkMode]);

    // ================== TEMA PROFESIONAL ==================
    const theme = darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-100' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-gray-900';
    
    const cardBg = darkMode 
        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 shadow-xl' 
        : 'bg-gradient-to-br from-white to-blue-50 border-gray-200 shadow-lg';
    
    const inputBg = darkMode 
        ? 'bg-gray-800 text-white border-gray-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20' 
        : 'bg-white text-gray-900 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';
    
    const navBg = darkMode 
        ? 'bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 border-gray-700' 
        : 'bg-gradient-to-r from-blue-600 via-blue-700 to-purple-600 border-blue-500';
    
    const buttonPrimary = darkMode 
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white' 
        : 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white';
    
    const buttonSuccess = darkMode 
        ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white' 
        : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white';
    
    const buttonDanger = darkMode 
        ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white' 
        : 'bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white';

    // ================== SISTEMA DE SUSCRIPCIÓN ==================
    const loadDataFromFirestore = useCallback(() => {
        try {
            setLoading(true);
            
            if (!window.firebaseDb) {
                console.error('Firebase no disponible');
                setLoading(false);
                return () => {};
            }

            let unsubscribeProducts = () => {};
            let unsubscribeSales = () => {};

            // Suscripción a productos
            try {
                const productsQuery = collection(window.firebaseDb, 'products');
                unsubscribeProducts = onSnapshot(productsQuery, 
                    (snapshot) => {
                        const productsData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        setProducts(productsData);
                        setLoading(false);
                    }, 
                    (error) => {
                        console.error('Error en productos:', error);
                        setLoading(false);
                    }
                );
            } catch (error) {
                console.error('Error en suscripción productos:', error);
                setLoading(false);
            }

            // Suscripción a ventas
            try {
                const salesQuery = collection(window.firebaseDb, 'sales');
                unsubscribeSales = onSnapshot(salesQuery, 
                    (snapshot) => {
                        const salesData = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        setSales(salesData);
                    }, 
                    (error) => {
                        console.error('Error en ventas:', error);
                    }
                );
            } catch (error) {
                console.error('Error en suscripción ventas:', error);
            }

            return () => {
                unsubscribeProducts();
                unsubscribeSales();
            };
            
        } catch (error) {
            console.error('Error inicializando suscripciones:', error);
            setLoading(false);
            return () => {};
        }
    }, []);

    // ================== SISTEMA DE AUTENTICACIÓN ==================
    useEffect(() => {
        let unsubscribeFirestore = () => {};
        
        const unsubscribeAuth = onAuthStateChanged(window.firebaseAuth, (user) => {
            setUser(user);
            unsubscribeFirestore = loadDataFromFirestore();
        });
        
        return () => {
            unsubscribeAuth();
            unsubscribeFirestore();
        };
    }, [loadDataFromFirestore]);

    // ================== FUNCIONES DE FIRESTORE ==================
    const saveProductToFirestore = useCallback(async (product) => {
        try {
            if (!window.firebaseDb) {
                throw new Error('Firebase no disponible');
            }

            if (product.id) {
                // Actualizar producto existente
                const productRef = doc(window.firebaseDb, 'products', product.id);
                
                const updateData = {
                    quantity: product.quantity,
                    updatedAt: serverTimestamp(),
                    lastUpdatedBy: user ? user.uid : 'caja-mode'
                };

                if (user) {
                    Object.assign(updateData, {
                        name: product.name,
                        category: product.category,
                        price: product.price,
                        minStock: product.minStock,
                        supplier: product.supplier,
                        description: product.description
                    });
                }

                await updateDoc(productRef, updateData);
                return product.id;
            } else {
                if (!user) {
                    throw new Error('Solo administradores pueden crear productos');
                }
                
                const productId = generateUniqueId('PROD-');
                
                const productData = {
                    name: product.name,
                    category: product.category,
                    quantity: product.quantity,
                    price: product.price,
                    minStock: product.minStock,
                    supplier: product.supplier,
                    description: product.description,
                    productId: productId,
                    createdAt: serverTimestamp(),
                    createdBy: user.uid
                };

                const docRef = doc(window.firebaseDb, 'products', productId);
                await setDoc(docRef, productData);
                
                return productId;
            }
        } catch (error) {
            console.error('Error guardando producto:', error);
            throw error;
        }
    }, [user]);

    const saveSaleToFirestore = useCallback(async (sale) => {
        try {
            if (!window.firebaseDb) {
                throw new Error('Firebase no disponible');
            }

            const saleId = generateUniqueId('SALE-');
            const invoiceId = generateUniqueId('INV-');

            const saleData = {
                saleId: saleId,
                invoiceId: invoiceId,
                productId: sale.productId,
                productName: sale.productName,
                quantity: sale.quantity,
                price: sale.price,
                total: sale.total,
                date: new Date().toISOString(),
                createdAt: serverTimestamp(),
                userId: user ? user.uid : 'caja-mode',
                mode: user ? 'admin' : 'caja'
            };

            const docRef = doc(window.firebaseDb, 'sales', saleId);
            await setDoc(docRef, saleData);
            
            return saleId;
        } catch (error) {
            console.error('Error guardando venta:', error);
            throw error;
        }
    }, [user]);

    const deleteProductFromFirestore = useCallback(async (productId) => {
        try {
            if (!window.firebaseDb) {
                throw new Error('Firebase no disponible');
            }

            await deleteDoc(doc(window.firebaseDb, 'products', productId));
        } catch (error) {
            console.error('Error eliminando producto:', error);
            throw error;
        }
    }, []);

   // ================== FUNCIONES DE VENTAS ==================
const markAsSold = useCallback(async (productId, quantity = 1) => {
    const product = products.find(p => p.id === productId);

    if (!product) {
        showNotification('Producto no encontrado', 'error');
        return;
    }

    if (product.quantity < quantity) {
        showNotification(`Stock insuficiente. Disponible: ${product.quantity} unidades`, 'error');
        return;
    }

    try {
        // Asegurar que el precio siempre sea número real
        const price = typeof product.price === "string"
            ? Number(product.price.replace(/,/g, ""))
            : Number(product.price);

        const total = Number((price * quantity).toFixed(2));

        const sale = {
            productId,
            productName: product.name,
            quantity,
            price,
            total,
            date: new Date().toISOString()
        };

        await saveSaleToFirestore(sale);

        const updatedProduct = {
            ...product,
            quantity: product.quantity - quantity
        };

        await saveProductToFirestore(updatedProduct);

        showNotification(
            `✅ Vendido: ${quantity} x ${product.name} - $${total.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
            "success"
        );

    } catch (error) {
        console.error('Error en venta:', error);
        showNotification('Error al procesar la venta', 'error');
    }
}, [products, showNotification, saveSaleToFirestore, saveProductToFirestore]);



const processSale = useCallback(async () => {
    if (currentSale.length === 0) {
        showNotification('No hay productos en la venta', 'error');
        return;
    }

    try {
        // VALIDAR STOCK ANTES DE PROCESAR
        for (const item of currentSale) {
            const product = products.find(p => p.id === item.id);

            if (!product) {
                showNotification(`Producto ${item.name} no encontrado`, 'error');
                return;
            }

            if (product.quantity < item.quantity) {
                showNotification(
                    `Stock insuficiente de ${item.name}. Disponible: ${product.quantity}`,
                    'error'
                );
                return;
            }
        }

        // PROCESAR CADA PRODUCTO
        for (const item of currentSale) {
            await markAsSold(item.id, item.quantity);
        }

        const invoiceId = generateUniqueId('INV-');
        const transactionId = generateUniqueId('TXN-');

        const invoice = {
            id: invoiceId,
            transactionId,
            items: currentSale,
            total: saleTotal,
            date: new Date().toISOString(),
            userId: user ? user.uid : 'caja-mode',
            invoiceNumber: `FAC-${Date.now().toString().slice(-6)}`
        };

        // GUARDAR FACTURA
        try {
            if (window.firebaseDb) {
                const invoiceRef = doc(window.firebaseDb, 'invoices', invoiceId);

                await setDoc(invoiceRef, {
                    ...invoice,
                    createdAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.warn('No se pudo guardar la factura:', error);
        }

        setCurrentSale([]);
        setShowSaleModal(false);

        if (saleTotal > 20000) {
            showNotification(
                `🎉 ¡VENTA MAYORISTA! Total: $${saleTotal.toLocaleString("en-US")} | Factura: ${invoiceId}`,
                "success"
            );
        } else {
            showNotification(
                `✅ Venta procesada - Total: $${saleTotal.toLocaleString("en-US")}`,
                "success"
            );
        }

        printInvoice(invoice);

    } catch (error) {
        console.error('Error al procesar venta:', error);
        showNotification('Error al procesar la venta', 'error');
    }

}, [currentSale, saleTotal, user, markAsSold, showNotification, products]);


       // ================== FUNCIONES DE CORREO ==================
    const sendLowStockEmail = useCallback(async (product) => {
        try {
            console.log('📧 Intentando enviar correo de alerta para:', product.name);
            
            if (!window.emailjs) {
                console.warn('EmailJS no está disponible');
                return;
            }
            
            const templateParams = {
                product_name: product.name,
                current_stock: product.quantity,
                min_stock: product.minStock,
                category: product.category,
                supplier: product.supplier || 'No especificado',
                to_email: 'angelcd659@gmail.com',
                date: new Date().toLocaleDateString('es-ES'),
                time: new Date().toLocaleTimeString('es-ES'),
                urgency_level: product.quantity === 0 ? 'CRÍTICA - SIN STOCK' : 
                              product.quantity <= product.minStock ? 'ALTA - Stock Bajo' : 'MEDIA - Stock por debajo del mínimo'
            };

            const response = await window.emailjs.send(
                'service_962fh0a', 
                'template_7iwlgxc', 
                templateParams
            );
            
            console.log('✅ Correo de alerta enviado exitosamente:', response.status, response.text);
            showNotification(`📧 Alerta enviada por correo: ${product.name}`, 'success');
            
        } catch (error) {
            console.error('❌ Error enviando correo:', error);
        }
    }, [showNotification]);

    const sendRestockEmail = useCallback(async (product, quantityAdded) => {
        try {
            if (!window.emailjs) {
                console.warn('EmailJS no está disponible');
                return;
            }

            const templateParams = {
                product_name: product.name,
                previous_stock: product.quantity - quantityAdded,
                current_stock: product.quantity,
                quantity_added: quantityAdded,
                min_stock: product.minStock,
                category: product.category,
                supplier: product.supplier || 'No especificado',
                to_email: 'angelcd659@gmail.com',
                date: new Date().toLocaleDateString('es-ES'),
                time: new Date().toLocaleTimeString('es-ES'),
                type: 'REABASTECIMIENTO EXITOSO'
            };

            await window.emailjs.send(
                'service_962fh0a',
                'template_7iwlgxc', 
                templateParams
            );
            
            console.log('✅ Correo de reabastecimiento enviado para:', product.name);
        } catch (error) {
            console.error('❌ Error enviando correo de reabastecimiento:', error);
        }
    }, []);
    
    // ================== FUNCIONES RESTANTES ==================
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(window.firebaseAuth, loginData.email, loginData.password);
            showNotification('Sesión de administrador iniciada', 'success');
            setShowLoginModal(false);
            setLoginData({ email: '', password: '' });
        } catch (error) {
            showNotification('Error al iniciar sesión', 'error');
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(window.firebaseAuth);
            showNotification('Sesión cerrada', 'success');
            setActiveTab('caja');
        } catch (error) {
            showNotification('Error al cerrar sesión', 'error');
        }
    };

    const addToSale = useCallback((product) => {
        if (product.quantity === 0) {
            showNotification('Producto sin stock disponible', 'error');
            return;
        }
        
        const existingItem = currentSale.find(item => item.id === product.id);
        if (existingItem) {
            if (existingItem.quantity >= product.quantity) {
                showNotification('No hay suficiente stock disponible', 'error');
                return;
            }
            setCurrentSale(prev => prev.map(item =>
                item.id === product.id 
                    ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price }
                    : item
            ));
        } else {
            setCurrentSale(prev => [...prev, {
                ...product,
                quantity: 1,
                total: product.price
            }]);
        }
        showNotification(`${product.name} agregado al carrito`, 'success');
    }, [currentSale, showNotification]);

    const removeFromSale = useCallback((productId) => {
        setCurrentSale(prev => prev.filter(item => item.id !== productId));
    }, []);

    const updateSaleQuantity = useCallback((productId, newQuantity) => {
        if (newQuantity < 1) {
            removeFromSale(productId);
            return;
        }
        
        const product = products.find(p => p.id === productId);
        if (product && newQuantity > product.quantity) {
            showNotification(`Solo hay ${product.quantity} unidades disponibles`, 'error');
            return;
        }
        
        setCurrentSale(prev => prev.map(item =>
            item.id === productId 
                ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
                : item
        ));
    }, [products, removeFromSale, showNotification]);

    const saleTotal = useMemo(() => {
        return currentSale.reduce((sum, item) => sum + (item.total || 0), 0);
    }, [currentSale]);

    const restockProduct = useCallback(async (productId) => {
        if (!user) {
            showNotification('Solo administradores pueden modificar stock', 'error');
            return;
        }

        const product = products.find(p => p.id === productId);
        if (!product) return;

        const newQuantity = prompt(`¿Cuántas unidades deseas agregar a "${product.name}"?\nStock actual: ${product.quantity}`, "10");
        
        if (newQuantity && !isNaN(newQuantity) && parseInt(newQuantity) > 0) {
            try {
                const updatedProduct = {
                    ...product,
                    quantity: product.quantity + parseInt(newQuantity)
                };
                
                await saveProductToFirestore(updatedProduct);
                showNotification(`✅ Se agregaron ${newQuantity} unidades a ${product.name}`, 'success');
            } catch (error) {
                showNotification('Error al actualizar el stock', 'error');
            }
        }
    }, [products, user, showNotification, saveProductToFirestore]);

    const stats = useMemo(() => {
        const totalSales = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalUnitsSold = sales.reduce((sum, sale) => sum + (sale.quantity || 0), 0);
        
        return {
            totalProducts: products.length,
            totalValue: products.reduce((sum, p) => sum + (p.quantity * p.price), 0),
            lowStock: products.filter(p => p.quantity <= p.minStock && p.quantity > 0).length,
            outOfStock: products.filter(p => p.quantity === 0).length,
            categories: [...new Set(products.map(p => p.category))].length,
            totalUnits: products.reduce((sum, p) => sum + p.quantity, 0),
            totalSales,
            totalUnitsSold,
            avgSale: sales.length > 0 ? totalSales / sales.length : 0,
            criticalAlerts: products.filter(p => p.quantity === 0).length + products.filter(p => p.quantity <= p.minStock && p.quantity > 0).length
        };
    }, [products, sales]);

    const alertProducts = useMemo(() => 
        products.filter(p => p.quantity <= p.minStock)
    , [products]);

    const filteredProducts = useMemo(() => {
        return products
            .filter(p => {
                const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    (p.supplier && p.supplier.toLowerCase().includes(searchTerm.toLowerCase())) ||
                                    (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
                const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                switch(sortBy) {
                    case 'name': return a.name.localeCompare(b.name);
                    case 'price': return b.price - a.price;
                    case 'quantity': return b.quantity - a.quantity;
                    case 'date': return new Date(b.date || (b.createdAt?.toDate ? b.createdAt.toDate() : 0)) - new Date(a.date || (a.createdAt?.toDate ? a.createdAt.toDate() : 0));
                    case 'value': return (b.quantity * b.price) - (a.quantity * a.price);
                    default: return 0;
                }
            });
    }, [products, searchTerm, filterCategory, sortBy]);

    const handleSubmit = useCallback(async () => {
        if (!user) {
            showNotification('Solo administradores pueden agregar productos', 'error');
            return;
        }

        if (!formData.name || !formData.quantity || !formData.price || !formData.minStock || !formData.supplier) {
            showNotification('Por favor completa todos los campos requeridos', 'error');
            return;
        }
        
        const quantity = parseInt(formData.quantity);
        const price = parseFloat(formData.price);
        const minStock = parseInt(formData.minStock);

        if (isNaN(quantity) || quantity < 0) {
            showNotification('La cantidad debe ser un número válido', 'error');
            return;
        }

        if (isNaN(price) || price <= 0) {
            showNotification('El precio debe ser un número mayor a 0', 'error');
            return;
        }

        if (isNaN(minStock) || minStock < 0) {
            showNotification('El stock mínimo debe ser un número válido', 'error');
            return;
        }

        try {
            if (editingProduct) {
                const updatedProduct = {
                    ...formData,
                    quantity: quantity,
                    price: price,
                    minStock: minStock,
                    id: editingProduct.id
                };
                
                await saveProductToFirestore(updatedProduct);
                showNotification('✅ Producto actualizado exitosamente', 'success');
                setEditingProduct(null);
            } else {
                const newProduct = {
                    ...formData,
                    quantity: quantity,
                    price: price,
                    minStock: minStock,
                    date: new Date().toISOString()
                };
                
                await saveProductToFirestore(newProduct);
                showNotification('✅ Producto agregado exitosamente', 'success');
            }
            
            setFormData({ name: '', category: 'Electrónica', quantity: '', price: '', minStock: '', supplier: '', description: '' });
            setShowForm(false);
        } catch (error) {
            showNotification('Error al guardar el producto', 'error');
        }
    }, [formData, editingProduct, user, showNotification, saveProductToFirestore]);

    const handleEdit = useCallback((product) => {
        if (!user) {
            showNotification('Solo administradores pueden editar productos', 'error');
            return;
        }
        setEditingProduct(product);
        setFormData({
            ...product,
            quantity: product.quantity.toString(),
            price: product.price.toString(),
            minStock: product.minStock.toString()
        });
        setShowForm(true);
    }, [user, showNotification]);

    const handleDelete = useCallback(async (id) => {
        if (!user) {
            showNotification('Solo administradores pueden eliminar productos', 'error');
            return;
        }

        if (confirm('¿Estás seguro de eliminar este producto? Esta acción no se puede deshacer.')) {
            try {
                await deleteProductFromFirestore(id);
                showNotification('✅ Producto eliminado exitosamente', 'success');
            } catch (error) {
                showNotification('Error al eliminar el producto', 'error');
            }
        }
    }, [user, showNotification, deleteProductFromFirestore]);

    const printInvoice = (invoice) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            showNotification('Error: No se pudo abrir la ventana de impresión', 'error');
            return;
        }
        
        const invoiceHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Factura ${invoice.id}</title>
                <style>
                    body { 
                        font-family: 'Arial', sans-serif; 
                        margin: 20px; 
                        background: white;
                        color: black;
                    }
                    .header { 
                        text-align: center; 
                        margin-bottom: 30px; 
                        border-bottom: 2px solid #333;
                        padding-bottom: 20px;
                    }
                    .company-info {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .invoice-info { 
                        margin-bottom: 30px; 
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 20px;
                    }
                    .invoice-id {
                        background: #f0f0f0;
                        padding: 10px;
                        border-radius: 5px;
                        margin-bottom: 10px;
                        font-family: monospace;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin-bottom: 30px; 
                    }
                    th, td { 
                        border: 1px solid #ddd; 
                        padding: 12px; 
                        text-align: left; 
                    }
                    th { 
                        background-color: #f2f2f2; 
                        font-weight: bold;
                    }
                    .total { 
                        text-align: right; 
                        font-size: 20px; 
                        font-weight: bold; 
                        margin-top: 20px;
                        border-top: 2px solid #333;
                        padding-top: 10px;
                    }
                    .footer {
                        margin-top: 50px;
                        text-align: center;
                        font-size: 12px;
                        color: #666;
                    }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                        .print-break { page-break-after: always; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>FACTURA DE VENTA</h1>
                    <div class="info de la compañia ">
                        <h2>TIENDA COMERCIAL</h2>
                        <p>Dirección: Av. Principal Santo Domingo #123</p>
                        <p>Teléfono: (849) 123-0090</p>
                        <p>Email: info@tienda.com</p>
                    </div>
                </div>
                
                <div class="invoice-id">
                    <strong>ID Factura:</strong> ${invoice.id}<br>
                    <strong>ID Transacción:</strong> ${invoice.transactionId}<br>
                    <strong>Número Factura:</strong> ${invoice.invoiceNumber}
                </div>
                
                <div class="invoice-info">
                    <div>
                        <p><strong>Fecha:</strong> ${new Date(invoice.date).toLocaleDateString('es-ES')}</p>
                        <p><strong>Hora:</strong> ${new Date(invoice.date).toLocaleTimeString('es-ES')}</p>
                    </div>
                    <div>
                        <p><strong>Cliente:</strong> CLIENTE GENERAL</p>
                        <p><strong>Vendedor:</strong> ${user ? 'ADMIN' : 'CAJA'}</p>
                        <p><strong>Forma de Pago:</strong> EFECTIVO</p>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Cantidad</th>
                            <th>Precio Unit.</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>$${item.price.toFixed(2)}</td>
                                <td>$${item.total.toFixed(2)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div class="total">
                    <p>TOTAL: $${invoice.total.toFixed(2)}</p>
                </div>
                
                <div class="footer">
                    <p>¡Gracias por su compra!</p>
                    <p>Esta factura es un documento válido para contabilidad</p>
                </div>
                
                <div class="no-print" style="margin-top: 30px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">🖨️ Imprimir Factura</button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">❌ Cerrar</button>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
    };

    // ================== TARJETA DE PRODUCTO MEJORADA ==================
    const ProductCard = ({ product }) => {
        const getStockColor = (quantity, minStock) => {
            if (quantity === 0) return 'from-red-500 to-rose-600';
            if (quantity <= minStock) return 'from-amber-500 to-orange-600';
            return 'from-emerald-500 to-green-600';
        };

        const getStockIcon = (quantity, minStock) => {
            if (quantity === 0) return 'alert-circle';
            if (quantity <= minStock) return 'alert-triangle';
            return 'check-circle';
        };

        const getStockText = (quantity, minStock) => {
            if (quantity === 0) return 'SIN STOCK';
            if (quantity <= minStock) return 'STOCK BAJO';
            return 'DISPONIBLE';
        };

        return (
            <div className={`${cardBg} rounded-2xl p-5 shadow-lg border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                product.quantity === 0 ? 'border-red-300 dark:border-red-500' :
                product.quantity <= product.minStock ? 'border-amber-300 dark:border-amber-500' : 
                'border-emerald-300 dark:border-emerald-500'
            }`}>
                {/* Encabezado con gradiente */}
                <div className="relative overflow-hidden rounded-xl mb-4">
                    <div className={`absolute inset-0 bg-gradient-to-r ${getStockColor(product.quantity, product.minStock)} opacity-10`}></div>
                    <div className="relative p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                        darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {product.category}
                                    </span>
                                    <span className={`flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full ${
                                        product.quantity === 0 
                                            ? 'bg-red-500/20 text-red-700 dark:text-red-300' 
                                            : product.quantity <= product.minStock 
                                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                                    }`}>
                                        <Icon name={getStockIcon(product.quantity, product.minStock)} size={12} />
                                        {getStockText(product.quantity, product.minStock)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                                    $${product.price.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500">por unidad</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{product.quantity}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">En Stock</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">${(product.quantity * product.price).toLocaleString()}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Valor Total</div>
                    </div>
                </div>

                {/* Barra de progreso */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Nivel de Stock</span>
                        <span className="font-semibold">Mínimo: {product.minStock}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                            className={`h-full bg-gradient-to-r ${getStockColor(product.quantity, product.minStock)} transition-all duration-500`}
                            style={{ 
                                width: `${Math.min((product.quantity / (product.minStock * 3)) * 100, 100)}%` 
                            }}
                        />
                    </div>
                </div>

      {/* Botones de acción */}
<div className="flex gap-2">
    <button
        onClick={() => markAsSold(product.id, 1)}
        className="flex-1 ${buttonSuccess} py-2 px-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
    >
        <span className="text-lg">🛒</span>
        Vender
    </button>
    
    {user && (
        <>
            <button
                onClick={() => restockProduct(product.id)}
                className={`${buttonPrimary} py-2 px-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                title="Restablecer stock"
            >
                <span className="text-lg">📦</span>
            </button>
            <button
                onClick={() => handleEdit(product)}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-2 px-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]"
                title="Editar"
            >
                <span className="text-lg">✏️</span>
            </button>
            <button
                onClick={() => handleDelete(product.id)}
                className={`${buttonDanger} py-2 px-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                title="Eliminar"
            >
                <span className="text-lg">🗑️</span>
            </button>
        </>
    )}
</div>
            </div>
        );
    };

    // ================== COMPONENTES DE SECCIONES ==================
    
  // Función para formatear números grandes con K / M / B automáticamente
const formatNumber = (num) => {
    if (num === null || num === undefined || isNaN(num)) return "$0.00";

    const absNum = Math.abs(num);
    const sign = num < 0 ? "-" : "";

    if (absNum >= 1_000_000_000) {
        return `${sign}$${(absNum / 1_000_000_000).toFixed(1)}B`;
    }
    if (absNum >= 1_000_000) {
        return `${sign}$${(absNum / 1_000_000).toFixed(1)}M`;
    }
    if (absNum >= 1_000) {
        return `${sign}$${(absNum / 1_000).toFixed(1)}K`;
    }

    return `${sign}$${absNum.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
};


// Dashboard de Estadísticas
const StatsDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
            { 
                title: 'Total Productos', 
                value: stats.totalProducts?.toLocaleString("en-US") || 0, 
                icon: 'package',
                color: 'from-blue-500 to-cyan-500',
                change: '+12%',
                trend: 'up'
            },
            { 
                title: 'Valor Total', 
                value: formatNumber(stats.totalValue), 
                icon: 'dollar-sign',
                color: 'from-emerald-500 to-green-500',
                change: '+23%',
                trend: 'up'
            },
            { 
                title: 'Ventas Totales', 
                value: formatNumber(stats.totalSales),
                icon: 'shopping-cart',
                color: 'from-purple-500 to-pink-500',
                change: '+18%',
                trend: 'up'
            },
            { 
                title: 'Alertas', 
                value: stats.criticalAlerts?.toLocaleString("en-US") || 0,
                icon: 'alert-triangle',
                color: stats.criticalAlerts > 0 
                    ? 'from-rose-500 to-red-500' 
                    : 'from-emerald-500 to-green-500',
                change: stats.criticalAlerts > 0 ? 'Atención' : '✓ OK',
                trend: stats.criticalAlerts > 0 ? 'warning' : 'ok'
            }
        ].map((stat, idx) => (
            <div 
                key={idx} 
                className={`${cardBg} rounded-2xl p-6 border-2 ${
                    darkMode ? 'border-gray-700' : 'border-gray-200'
                }`}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                        <Icon name={stat.icon} size={24} className="text-white" />
                    </div>

                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                        stat.trend === 'up'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                            : stat.trend === 'warning'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    }`}>
                        {stat.change}
                    </div>
                </div>

                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
            </div>
        ))}
    </div>
);

    // ================== RENDERIZADO PRINCIPAL ==================
    
    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme}`}>
                <div className="text-center">
                    <div className="relative">
                        <div className="w-24 h-24 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Icon name="package" size={32} className="text-blue-500 animate-pulse" />
                        </div>
                    </div>
                    <p className="text-xl font-semibold mt-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Cargando Sistema...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${theme} transition-colors duration-300`}>
            {/* Notificaciones */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl transform transition-all duration-300 animate-slide-in-right ${
                    notification.type === 'success' 
                        ? 'bg-gradient-to-r from-emerald-500 to-green-600' 
                        : 'bg-gradient-to-r from-rose-500 to-red-600'
                } text-white flex items-center gap-3 max-w-md`}>
                    <Icon name={notification.type === 'success' ? "check-circle" : "alert-circle"} size={20} />
                    <div className="flex-1 font-medium">{notification.message}</div>
                    <button onClick={() => setNotification(null)} className="hover:bg-white/20 p-1 rounded">
                        <Icon name="x" size={20} />
                    </button>
                </div>
            )}

            {/* Header Mejorado */}
            <header className={`${navBg} backdrop-blur-lg shadow-2xl sticky top-0 z-40 border-b transition-all duration-300`}>
                <div className="max-w-7xl mx-auto px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur opacity-20"></div>
                                <div className="relative p-2 bg-white/10 backdrop-blur-sm rounded-xl">
                                    <Icon name="package" size={32} className="text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">
                                    {user ? 'Inventario Pro' : 'Sistema de Caja'}
                                </h1>
                                <p className="text-xs text-blue-200 font-medium">
                                    {user ? 'Modo Administrador' : 'Modo Caja - Solo Ventas'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            {/* Botón Modo Oscuro/Claro con emojis */}
                            <button
                                onClick={() => {
                                    const newDarkMode = !darkMode;
                                    setDarkMode(newDarkMode);
                                    localStorage.setItem('darkMode', newDarkMode.toString());
                                }}
                                className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-lg text-lg"
                                title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
                            >
                                {darkMode ? '☀️' : '🌙'}
                            </button>

                            {user ? (
                                <>
                                    <div className={`px-3 py-2 rounded-xl ${darkMode ? 'bg-gray-800/50' : 'bg-blue-500/20'} flex items-center gap-2`}>
                                        <span className="text-lg">👨‍💼</span>
                                        <span className="text-sm text-white font-medium truncate max-w-[120px]">{user.email.split('@')[0]}</span>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className={`px-4 py-2 rounded-xl ${buttonDanger} flex items-center gap-2 transition-all duration-300 transform hover:scale-105 text-lg`}
                                        title="Cerrar sesión"
                                    >
                                        🚪
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setShowLoginModal(true)}
                                    className={`px-4 py-2 rounded-xl ${buttonSuccess} flex items-center gap-2 transition-all duration-300 transform hover:scale-105 text-lg`}
                                    title="Iniciar sesión"
                                >
                                    🔑
                                </button>
                            )}
                            
                            <button
                                onClick={() => setShowSaleModal(true)}
                                className={`px-4 py-2 rounded-xl ${buttonPrimary} flex items-center gap-2 transition-all duration-300 transform hover:scale-105 relative text-lg`}
                                title="Carrito de ventas"
                            >
                                🛒
                                {currentSale.length > 0 && (
                                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold">
                                        {currentSale.length}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

           {/* Barra de Navegación */}
<nav className={`sticky top-[73px] z-30 ${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
    <div className="max-w-7xl mx-auto px-4">
        <div className="flex overflow-x-auto scrollbar-hide">
            {(!user ? [
                { id: 'caja', label: 'Caja', icon: '🛒' },
                { id: 'productos', label: 'Productos', icon: '📦' },
                { id: 'ventas', label: 'Ventas', icon: '💰' }
            ] : [
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'productos', label: 'Productos', icon: '📦' },
                { id: 'ventas', label: 'Ventas', icon: '🧾' },
                { id: 'alertas', label: 'Alertas', icon: '⚠️' }
            ]).map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-5 py-4 font-medium transition-all duration-300 whitespace-nowrap relative group ${
                        activeTab === tab.id
                            ? `${darkMode ? 'text-blue-400' : 'text-blue-600'}`
                            : `${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`
                    }`}
                >
                    <div className={`p-2 rounded-lg transition-all duration-300 ${
                        activeTab === tab.id 
                            ? `${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`
                            : `${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`
                    }`}>
                        <span className="text-lg">{tab.icon}</span>
                    </div>
                    <span className="font-semibold">{tab.label}</span>
                    {tab.id === 'alertas' && stats.criticalAlerts > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full animate-pulse">
                            {stats.criticalAlerts}
                        </span>
                    )}
                    {activeTab === tab.id && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"></div>
                    )}
                </button>
            ))}
        </div>
    </div>
</nav>
            {/* Contenido Principal */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                {/* MODO CAJA */}
                {!user && activeTab === 'caja' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className={`${cardBg} rounded-3xl p-8 border-2 ${darkMode ? 'border-emerald-700' : 'border-emerald-200'}`}>
                            <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                                            <Icon name="shopping-bag" size={32} className="text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                                MODO CAJA ACTIVADO
                                            </h2>
                                            <p className="text-gray-600 dark:text-gray-400">
                                                Sistema listo para procesar ventas rápidamente
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-emerald-50'} border ${darkMode ? 'border-emerald-700' : 'border-emerald-200'}`}>
                                            <Icon name="zap" size={24} className="text-emerald-500 mb-2" />
                                            <h3 className="font-semibold mb-1">Ventas Rápidas</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Procesa ventas en segundos</p>
                                        </div>
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-blue-50'} border ${darkMode ? 'border-blue-700' : 'border-blue-200'}`}>
                                            <Icon name="search" size={24} className="text-blue-500 mb-2" />
                                            <h3 className="font-semibold mb-1">Búsqueda Instantánea</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Encuentra productos rápido</p>
                                        </div>
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-purple-50'} border ${darkMode ? 'border-purple-700' : 'border-purple-200'}`}>
                                            <Icon name="file-text" size={24} className="text-purple-500 mb-2" />
                                            <h3 className="font-semibold mb-1">Facturación</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Imprime facturas profesionales</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowSaleModal(true)}
                                        className={`${buttonSuccess} px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                                    >
                                        <Icon name="shopping-cart" size={24} />
                                        INICIAR VENTA
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Búsqueda rápida */}
                        <div className={`${cardBg} rounded-2xl p-6`}>
                            <div className="relative">
                                <Icon name="search" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="🔍 Buscar producto por nombre, categoría o proveedor..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={`${inputBg} w-full pl-12 pr-4 py-4 rounded-xl text-lg font-medium`}
                                />
                            </div>
                        </div>

                        {/* Productos destacados */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProducts.filter(p => p.quantity > 0).slice(0, 6).map(product => (
                                <div key={product.id} className={`${cardBg} rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl border-2 ${darkMode ? 'border-emerald-700' : 'border-emerald-200'}`}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
                                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${darkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                                                {product.category}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">${product.price.toFixed(2)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Stock disponible</p>
                                            <p className={`text-lg font-bold ${
                                                product.quantity === 0 ? 'text-red-500' :
                                                product.quantity <= product.minStock ? 'text-amber-500' : 'text-emerald-500'
                                            }`}>
                                                {product.quantity} unidades
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => addToSale(product)}
                                        className={`w-full ${buttonSuccess} py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                                    >
                                        <Icon name="plus" size={18} />
                                        Agregar al Carrito
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* DASHBOARD ADMIN */}
                {user && activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-fade-in">
                        <StatsDashboard />
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Acciones rápidas */}
                            <div className={`${cardBg} rounded-2xl p-6`}>
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                    <Icon name="zap" size={24} className="text-amber-500" />
                                    <span>Acciones Rápidas</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { label: 'Nuevo Producto', icon: 'plus', color: 'blue', action: () => { setActiveTab('productos'); setShowForm(true); } },
                                        { label: 'Ver Alertas', icon: 'alert-triangle', color: 'red', action: () => setActiveTab('alertas') },
                                        { label: 'Ver Ventas', icon: 'trending-up', color: 'green', action: () => setActiveTab('ventas') },
                                    ].map((btn, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={btn.action}
                                            className={`flex flex-col items-center gap-3 p-5 rounded-xl bg-gradient-to-br from-${btn.color}-500 to-${btn.color}-600 text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]`}
                                        >
                                            <Icon name={btn.icon} size={24} />
                                            <span className="text-sm font-medium">{btn.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Estadísticas adicionales */}
                            <div className={`${cardBg} rounded-2xl p-6`}>
                                <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                                    <Icon name="bar-chart-3" size={24} className="text-purple-500" />
                                    <span>Métricas Clave</span>
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Unidades totales en inventario</span>
                                        <span className="font-bold text-lg">{stats.totalUnits}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Categorías activas</span>
                                        <span className="font-bold text-lg">{stats.categories}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Venta promedio</span>
                                        <span className="font-bold text-lg">${stats.avgSale.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600 dark:text-gray-400">Productos sin stock</span>
                                        <span className={`font-bold text-lg ${stats.outOfStock > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            {stats.outOfStock}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRODUCTOS */}
                {(activeTab === 'productos' || (user && activeTab === 'productos')) && (
                    <div className="space-y-8 animate-fade-in">
                        {/* Controles */}
                        <div className={`${cardBg} rounded-2xl p-6`}>
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="relative flex-1">
                                    <Icon name="search" size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="🔍 Buscar por nombre, proveedor o descripción..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`${inputBg} w-full pl-12 pr-4 py-3 rounded-xl font-medium`}
                                    />
                                </div>
                                
                                <div className="flex gap-3">
                                    <select
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className={`${inputBg} px-4 py-3 rounded-xl font-medium`}
                                    >
                                        <option value="all">📦 Todas las categorías</option>
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>

                                    {user && (
                                        <button
                                            onClick={() => {
                                                setShowForm(!showForm);
                                                setEditingProduct(null);
                                                setFormData({ name: '', category: 'Electrónica', quantity: '', price: '', minStock: '', supplier: '', description: '' });
                                            }}
                                            className={`${buttonPrimary} px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                                        >
                                            <Icon name="plus" size={20} />
                                            <span>Nuevo Producto</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between mt-4 text-sm">
                                <span className="font-medium text-gray-600 dark:text-gray-400">
                                    Mostrando <span className="font-bold text-blue-600 dark:text-blue-400">{filteredProducts.length}</span> de <span className="font-bold">{products.length}</span> productos
                                </span>
                                {!user && (
                                    <span className="text-amber-600 dark:text-amber-400 font-medium">
                                        🔒 Modo Caja - Solo lectura
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Formulario */}
                        {user && showForm && (
                            <ProductForm
                                formData={formData}
                                setFormData={setFormData}
                                darkMode={darkMode}
                                handleSubmit={handleSubmit}
                                editingProduct={editingProduct}
                                setShowForm={setShowForm}
                                setEditingProduct={setEditingProduct}
                                user={user}
                                categories={categories}
                            />
                        )}

                        {/* Grid de productos */}
                        {products.length === 0 ? (
                            <div className={`${cardBg} rounded-2xl p-12 text-center`}>
                                <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                                    <Icon name="package" size={64} className="text-white" />
                                </div>
                                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    ¡No hay productos!
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg max-w-2xl mx-auto">
                                    {user 
                                        ? 'Tu inventario está vacío. Comienza agregando tus primeros productos.'
                                        : 'No hay productos disponibles para venta.'
                                    }
                                </p>
                                {user && (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className={`${buttonPrimary} px-8 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                                    >
                                        <Icon name="plus" size={24} />
                                        Agregar Primer Producto
                                    </button>
                                )}
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className={`${cardBg} rounded-2xl p-12 text-center`}>
                                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-r from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                                    <Icon name="search" size={48} className="text-gray-500 dark:text-gray-400" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">No se encontraron productos</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">Intenta ajustar los filtros de búsqueda</p>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterCategory('all');
                                    }}
                                    className={`${buttonPrimary} px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                                >
                                    Limpiar Filtros
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProducts.map(product => (
                                    <ProductCard key={product.id} product={product} />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* VENTAS */}
                {(activeTab === 'ventas' || (user && activeTab === 'ventas')) && (
                    <div className="space-y-8 animate-fade-in">
                        <div className={`${cardBg} rounded-2xl p-6`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl">
                                    <Icon name="credit-card" size={32} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Historial de Ventas</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {user ? 'Registro completo de ventas' : 'Tus ventas recientes'}
                                    </p>
                                </div>
                            </div>

                            {sales.length === 0 ? (
                                <div className="text-center py-16">
                                    <div className="inline-block p-8 bg-gradient-to-br from-emerald-500/10 to-green-600/5 rounded-full mb-6">
                                        <Icon name="shopping-cart" size={64} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-gray-600 dark:text-gray-400 mb-3">📦 No hay ventas registradas</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">Las ventas aparecerán aquí</p>
                                    <button
                                        onClick={() => setShowSaleModal(true)}
                                        className={`${buttonSuccess} px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                                    >
                                        <Icon name="shopping-cart" size={24} />
                                        Realizar Primera Venta
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-emerald-50'}`}>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Ventas</p>
                                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${stats.totalSales.toLocaleString()}</p>
                                        </div>
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-blue-50'}`}>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Unidades Vendidas</p>
                                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalUnitsSold}</p>
                                        </div>
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-purple-50'}`}>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Venta Promedio</p>
                                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">${stats.avgSale.toFixed(2)}</p>
                                        </div>
                                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-amber-50'}`}>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Ventas</p>
                                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{sales.length}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {sales.slice().reverse().slice(0, 20).map(sale => (
                                            <div key={sale.id} className={`border-l-4 border-emerald-500 ${darkMode ? 'bg-emerald-900/10' : 'bg-emerald-50'} p-4 rounded-xl transition-all duration-300 hover:scale-[1.005]`}>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="p-2 bg-gradient-to-br from-emerald-500/20 to-green-600/10 rounded-lg">
                                                                <Icon name="check-circle" size={20} className="text-emerald-500" />
                                                            </div>
                                                            <div>
                                                                <h3 className="font-bold text-lg">{sale.productName}</h3>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {sale.saleId && `ID: ${sale.saleId} • `}
                                                                    {new Date(sale.date).toLocaleDateString('es-ES')} • {new Date(sale.date).toLocaleTimeString('es-ES')}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${sale.total.toLocaleString()}</p>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            {sale.quantity} uds × ${sale.price}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ALERTAS */}
                {user && activeTab === 'alertas' && (
                    <div className="space-y-8 animate-fade-in">
                        <div className={`${cardBg} rounded-2xl p-6`}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-gradient-to-br from-rose-500 to-red-600 rounded-xl">
                                    <Icon name="bell" size={32} className="text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold">Sistema de Alertas</h2>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Productos que requieren atención inmediata</p>
                                </div>
                            </div>

                            {alertProducts.length === 0 && stats.outOfStock === 0 ? (
                                <div className="text-center py-16">
                                    <div className="inline-block p-8 bg-gradient-to-br from-emerald-500/10 to-green-600/5 rounded-full mb-6">
                                        <Icon name="check-circle" size={64} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-3">🎉 ¡Todo en orden!</h3>
                                    <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">No hay productos con stock bajo en este momento</p>
                                    <button
                                        onClick={() => setActiveTab('productos')}
                                        className={`${buttonPrimary} px-8 py-4 rounded-xl font-semibold text-lg flex items-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                                    >
                                        <Icon name="package" size={24} />
                                        Ver Todos los Productos
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className={`p-5 rounded-xl bg-gradient-to-r ${darkMode ? 'from-rose-900/30 to-red-900/20' : 'from-rose-50 to-red-50'} border-2 ${darkMode ? 'border-rose-700' : 'border-rose-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <Icon name="alert-triangle" size={24} className="text-rose-500" />
                                            <div>
                                                <p className="font-bold text-rose-600 dark:text-rose-400 text-lg">
                                                    ⚠️ {stats.criticalAlerts} producto{stats.criticalAlerts > 1 ? 's' : ''} requiere{stats.criticalAlerts === 1 ? '' : 'n'} atención inmediata
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                    {stats.outOfStock > 0 && `${stats.outOfStock} sin stock • `}
                                                    {stats.lowStock > 0 && `${stats.lowStock} con stock bajo`}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Productos sin stock */}
                                    {products.filter(p => p.quantity === 0).length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-xl font-bold mb-4 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                                <Icon name="x-circle" size={24} />
                                                Productos Sin Stock ({stats.outOfStock})
                                            </h3>
                                            {products.filter(p => p.quantity === 0).map(product => (
                                                <div 
                                                    key={product.id} 
                                                    className={`border-l-4 border-rose-500 ${darkMode ? 'bg-rose-900/20' : 'bg-rose-50'} p-6 rounded-xl mb-4 transition-all duration-300 hover:scale-[1.005]`}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-start gap-3 mb-4">
                                                                <div className="p-3 bg-rose-500/20 rounded-xl">
                                                                    <Icon name="package" size={28} className="text-rose-500" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h3 className="font-bold text-xl mb-1">{product.name}</h3>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        {product.category} • {product.supplier}
                                                                    </p>
                                                                    <div className="mt-2 inline-block px-3 py-1 bg-gradient-to-r from-rose-500 to-red-600 text-white text-xs font-bold rounded-full">
                                                                        ❌ SIN STOCK - URGENTE
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex md:flex-col gap-3">
                                                            <button
                                                                onClick={() => restockProduct(product.id)}
                                                                className={`${buttonSuccess} px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                                                            >
                                                                <Icon name="refresh-cw" size={18} />
                                                                <span>Agregar Stock</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Productos con stock bajo */}
                                    {products.filter(p => p.quantity <= p.minStock && p.quantity > 0).length > 0 && (
                                        <div>
                                            <h3 className="text-xl font-bold mb-4 text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                                <Icon name="alert-triangle" size={24} />
                                                Productos con Stock Bajo ({stats.lowStock})
                                            </h3>
                                            {products.filter(p => p.quantity <= p.minStock && p.quantity > 0).map(product => (
                                                <div 
                                                    key={product.id} 
                                                    className={`border-l-4 border-amber-500 ${darkMode ? 'bg-amber-900/20' : 'bg-amber-50'} p-6 rounded-xl mb-4 transition-all duration-300 hover:scale-[1.005]`}
                                                >
                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-start gap-3 mb-4">
                                                                <div className="p-3 bg-amber-500/20 rounded-xl">
                                                                    <Icon name="package" size={28} className="text-amber-500" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h3 className="font-bold text-xl mb-1">{product.name}</h3>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        {product.category} • {product.supplier}
                                                                    </p>
                                                                    <div className="mt-2 inline-block px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold rounded-full">
                                                                        ⚠️ STOCK BAJO
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex md:flex-col gap-3">
                                                            <button
                                                                onClick={() => restockProduct(product.id)}
                                                                className={`${buttonSuccess} px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                                                            >
                                                                <Icon name="refresh-cw" size={18} />
                                                                <span>Reabastecer</span>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            {/* Modal de Login */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className={`${cardBg} rounded-2xl p-8 w-full max-w-md`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                                    <Icon name="lock" size={24} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold">Acceso Administrador</h2>
                            </div>
                            <button onClick={() => setShowLoginModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                                <Icon name="x" size={24} />
                            </button>
                        </div>
                        
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                                    className={`${inputBg} w-full px-4 py-3 rounded-xl border`}
                                    placeholder="admin@tienda.com"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-2">Contraseña</label>
                                <input
                                    type="password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                    className={`${inputBg} w-full px-4 py-3 rounded-xl border`}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className={`flex-1 ${buttonPrimary} py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                                >
                                    <span className="text-lg">🔑</span>
                                    Iniciar Sesión
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowLoginModal(false)}
                                    className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all duration-300"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Venta */}
            {showSaleModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className={`${cardBg} rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg">
                                    <Icon name="shopping-cart" size={24} className="text-white" />
                                </div>
                                <h2 className="text-2xl font-bold">Procesar Venta</h2>
                            </div>
                            <button onClick={() => setShowSaleModal(false)} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">
                                <Icon name="x" size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Productos disponibles */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Icon name="package" size={20} className="text-blue-500" />
                                    Productos Disponibles
                                </h3>
                                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                    {products.filter(p => p.quantity > 0).map(product => (
                                        <div key={product.id} className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center transition-all duration-300 hover:scale-[1.01]`}>
                                            <div>
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    Stock: {product.quantity} • ${product.price}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => addToSale(product)}
                                                className={`${buttonPrimary} px-4 py-2 rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95`}
                                            >
                                                Agregar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                           {/* Carrito */}
<div>
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Icon name="shopping-bag" size={20} className="text-emerald-500" />
        Carrito de Venta
    </h3>

    {currentSale.length === 0 ? (
        <div className="text-center py-8">
            <Icon name="shopping-cart" size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
                No hay productos en el carrito
            </p>
        </div>
    ) : (
        <div className="space-y-3">
            {currentSale.map(item => {
                // Convertir precio si viene como string con comas
                const price = typeof item.price === "string"
                    ? Number(item.price.replace(/,/g, ""))
                    : Number(item.price);

                const itemTotal = (price * item.quantity).toFixed(2);

                return (
                    <div
                        key={item.id}
                        className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    ${price.toLocaleString("en-US", { minimumFractionDigits: 2 })} c/u
                                </p>
                            </div>

                            <button
                                onClick={() => removeFromSale(item.id)}
                                className="text-rose-500 hover:text-rose-700 transition-colors"
                            >
                                <Icon name="trash-2" size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => updateSaleQuantity(item.id, item.quantity - 1)}
                                    className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    -
                                </button>

                                <span className="font-bold w-8 text-center">{item.quantity}</span>

                                <button
                                    onClick={() => updateSaleQuantity(item.id, item.quantity + 1)}
                                    className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                >
                                    +
                                </button>
                            </div>

                            <span className="ml-auto font-bold text-lg text-emerald-600 dark:text-emerald-400">
                                ${Number(itemTotal).toLocaleString("en-US", {
                                    minimumFractionDigits: 2
                                })}
                            </span>
                        </div>
                    </div>
                );
            })}

            {/* Total */}
            <div className="border-t pt-4">
                <div className="flex justify-between items-center text-xl font-bold">
                    <span>Total:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                        ${Number(saleTotal).toLocaleString("en-US", {
                            minimumFractionDigits: 2
                        })}
                    </span>
                </div>
            </div>

            {/* Botones */}
            <div className="flex gap-3">
                <button
                    onClick={processSale}
                    className={`flex-1 ${buttonSuccess} py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98]`}
                >
                    <span className="text-lg">✅</span>
                    Procesar Venta
                </button>

                <button
                    onClick={() => setShowSaleModal(false)}
                    className="px-6 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-xl font-semibold transition-all duration-300"
                >
                    Cerrar
                </button>
            </div>
        </div>
    )}
</div>
                        </div>
                    </div>
                </div>
            )}  

            {/* Footer */}
            <footer className={`${darkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-xl border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} mt-12`}>
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                                <Icon name="package" size={24} className="text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-lg">
                                    {user ? 'Inventario Pro' : 'Sistema de Caja'}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                    Sistema profesional de gestión
                                </p>
                            </div>
                        </div>
                        <div className="text-center md:text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">© 2025 Sistema Profesional</p>
                            <p className="text-xs text-gray-500 dark:text-gray-500">Conectado a Firebase • Modo {darkMode ? 'oscuro 🌙' : 'claro ☀️'}</p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// Añadir estilos CSS personalizados
const style = document.createElement('style');
style.textContent = `
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slide-in-right {
        from { opacity: 0; transform: translateX(100%); }
        to { opacity: 1; transform: translateX(0); }
    }
    
    .animate-fade-in {
        animation: fade-in 0.5s ease-out;
    }
    
    .animate-slide-in-right {
        animation: slide-in-right 0.3s ease-out;
    }
    
    .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
    }
    
    .scrollbar-hide::-webkit-scrollbar {
        display: none;
    }
    
    .lucide {
        stroke-width: 1.5;
    }
`;
document.head.appendChild(style);

// Inicializar iconos Lucide cuando estén disponibles
setTimeout(() => {
    if (window.lucide) {
        lucide.createIcons();
    }
}, 100);

// Renderizar la aplicación
ReactDOM.render(React.createElement(InventoryManagementSystem), document.getElementById('root'));