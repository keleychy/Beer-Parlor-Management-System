// Test offline functionality
async function testOfflineFeatures() {
  console.log('1. First, turn off your internet connection')
  console.log('2. Try these operations:')
  
  // Test adding a product
  try {
      const newProduct = {
        name: 'Test Offline Beer',
        category: 'Beer',
        quantity: 100,
        reorderLevel: 20,
        unitPrice: 500,
        quantityPerCrate: 12
      }
    const result = await addProduct(newProduct)
    console.log('✓ Added product while offline:', result)
  } catch (error) {
    console.error('× Failed to add product:', error)
  }

  // Test recording a sale
  try {
      const newSale = {
        productId: 'any-product-id',
        productName: 'Test Offline Beer',
        quantity: 5,
        unitPrice: 500,
        totalPrice: 2500,
        attendantId: 'any-attendant-id',
        attendantName: 'Test Attendant'
      }
    const result = await addSale(newSale)
    console.log('✓ Recorded sale while offline:', result)
  } catch (error) {
    console.error('× Failed to record sale:', error)
  }

  console.log('3. Now turn your internet back on')
  console.log('4. Watch the sync process in the browser console')
}

// Add a button to trigger the test
const testButton = document.createElement('button')
testButton.textContent = 'Test Offline Features'
testButton.style.position = 'fixed'
testButton.style.bottom = '20px'
testButton.style.left = '20px'
testButton.style.padding = '10px'
testButton.style.backgroundColor = '#4CAF50'
testButton.style.color = 'white'
testButton.style.border = 'none'
testButton.style.borderRadius = '5px'
testButton.style.cursor = 'pointer'
testButton.onclick = testOfflineFeatures

document.body.appendChild(testButton)