const balance = document.getElementById('total-val')
const incAmt = document.getElementById('inc-amt')
const expAmt = document.getElementById('exp-amt')
const list = document.getElementById('trans-list')
const form = document.getElementById('trans-form')
const desc = document.getElementById('desc')
const amt = document.getElementById('amt')
const type = document.getElementById('type-select')
const category = document.getElementById('cat-select')
const budgetBar = document.getElementById('budget-bar')
const budgetTxt = document.getElementById('budget-txt')

let transactions = JSON.parse(localStorage.getItem('khata_book')) || []

function save() {
  localStorage.setItem('khata_book', JSON.stringify(transactions))
  render()
}

function validateInputs(description, amount) {
  if (!description || !amount) {
    showToast('Enter complete details!', '#f43f5e')
    return false
  }
  if (isNaN(amount) || amount <= 0) {
    showToast('Amount must be a positive number!', '#f43f5e')
    return false
  }
  return true
}

function add(e) {
  e.preventDefault()
  const d = desc.value.trim()
  const a = +amt.value

  if (!validateInputs(d, a)) {
    return
  }

  const item = {
    id: Date.now(),
    text: d,
    category: category.value,
    val: type.value === 'minus' ? -Math.abs(a) : Math.abs(a),
    time: new Date().toLocaleString(),
    date: new Date().toISOString().split('T')[0]
  }

  transactions.push(item)
  desc.value = ''
  amt.value = ''
  save()
  showToast('Added Successfully! ✅')
}

function remove(id) {
  transactions = transactions.filter(t => t.id !== id)
  save()
  showToast('Record Deleted')
}

function edit(id) {
  const t = transactions.find(x => x.id === id)
  if (!t) return

  const newText = prompt('Update description:', t.text)
  if (newText === null || newText.trim() === '') return

  const newAmt = prompt('Update amount (₹):', Math.abs(t.val))
  if (newAmt === null || isNaN(newAmt) || +newAmt <= 0) return

  transactions = transactions.map(x => {
    if (x.id === id) {
      return {
        ...x,
        text: newText.trim(),
        val: x.val < 0 ? -Math.abs(+newAmt) : Math.abs(+newAmt)
      }
    }
    return x
  })
  save()
}

function filterByCategory(cat) {
  return transactions.filter(t => t.category === cat)
}

function getHighestTransaction() {
  if (transactions.length === 0) return null
  return transactions.reduce((max, t) => Math.abs(t.val) > Math.abs(max.val) ? t : max, transactions[0])
}

function showToast(m, bg = '#0f172a') {
  const t = document.createElement('div')
  t.innerText = m
  t.className = 'toast-msg'
  if (bg !== '#0f172a') t.style.background = bg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 2500)
}

function render() {
  list.innerHTML = ''
  if (transactions.length === 0) {
    list.innerHTML = `<li class="empty-ledger">Empty Ledger</li>`
  }

  transactions.forEach(t => {
    const li = document.createElement('li')
    li.className = t.val < 0 ? 'minus' : 'plus'
    li.innerHTML = `
            <div class="trans-info" onclick="edit(${t.id})">
                <span class="trans-text">${t.text}</span>
                <span class="cat-tag">${t.category}</span>
                <small class="trans-time">${t.time}</small>
            </div>
            <div class="trans-amt-box">
                <p class="trans-amt">₹${Math.abs(t.val).toFixed(2)}</p>
                <button class="delete-icon" onclick="remove(${t.id})">🗑</button>
            </div>
        `
    list.appendChild(li)
  })
  updateDash()
}

function updateDash() {
  const vals = transactions.map(t => t.val)
  const total = vals.reduce((a, b) => a + b, 0)
  const pos = vals.filter(v => v > 0).reduce((a, b) => a + b, 0)
  const neg = Math.abs(vals.filter(v => v < 0).reduce((a, b) => a + b, 0))

  balance.innerText = `₹${total.toLocaleString('en-IN')}`
  incAmt.innerText = `₹${pos.toLocaleString('en-IN')}`
  expAmt.innerText = `₹${neg.toLocaleString('en-IN')}`

  let p = 0
  if (pos > 0) p = Math.min((neg / pos) * 100, 100)
  else if (neg > 0) p = 100

  budgetBar.style.width = p + '%'
  budgetTxt.innerText = `${Math.round(p)}% of Budget Consumed`

  if (p > 90) budgetBar.style.background = '#f43f5e'
  else if (p > 60) budgetBar.style.background = '#f59e0b'
  else budgetBar.style.background = '#10b981'
}

function exportData() {
  const blob = new Blob([JSON.stringify(transactions)], {
    type: 'application/json'
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'my_expenses.json'
  a.click()
  showToast('Data Exported!')
}

function clearAll() {
  if (confirm('Delete every single record?')) {
    transactions = []
    save()
    showToast('Ledger Cleared', '#f43f5e')
  }
}

form.addEventListener('submit', add)

document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('.history-view')
  const expBtn = document.createElement('button')
  expBtn.innerText = 'Export JSON'
  expBtn.className = 'export-btn'
  expBtn.onclick = exportData
  footer.insertBefore(expBtn, footer.firstChild)

  const clear = document.createElement('button')
  clear.innerText = 'Reset All'
  clear.className = 'clear-all-btn'
  clear.onclick = clearAll
  footer.insertBefore(clear, footer.firstChild)

  render()
})
