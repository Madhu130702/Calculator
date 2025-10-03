const display = document.getElementById('display');
const exprEl = document.getElementById('expr');

let a = null;          // first operand
let b = null;          // second operand
let op = null;         // current operator
let overwrite = true;  // whether next digit starts fresh
let buffer = "0";      // current number being typed as string
let expr = "";         // expression preview (e.g., "12 + ")
let justComputed = false;

function setDisplay(text) {
  display.textContent = text.toString().slice(0, 16);
}

function setExpr(text) {
  if (exprEl) exprEl.textContent = text || "";
}

function refreshUI() {
  // Show the expression line and the current buffer
  setExpr(expr);
  setDisplay(buffer);
}

function resetAll() {
  a = b = op = null;
  overwrite = true;
  buffer = "0";
  expr = "";
  justComputed = false;
  refreshUI();
}

// Number / dot input
function inputNumber(d) {
  // If the last action was "=", start a new calculation when typing a digit
  if (justComputed && op === null) {
    a = null;
    expr = "";
    buffer = "0";
    justComputed = false;
  }

  if (overwrite) {
    buffer = (d === ".") ? "0." : d;
    overwrite = false;
  } else {
    if (d === "." && buffer.includes(".")) return;
    buffer = (buffer === "0" && d !== ".") ? d : buffer + d;
  }
  refreshUI();
}

// Choose operator (+, -, *, /, %)
function chooseOp(nextOp) {
  const current = parseFloat(buffer);

  if (op && !overwrite) {
    // We had a pending op and user just finished typing 'b' -> compute partial
    b = current;
    const res = operate(a, b, op);
    if (res === "Error") {
      setDisplay("Error");
      resetAll();
      return;
    }
    a = res;
    buffer = String(res);
    expr = `${trimNum(a)} ${symbol(nextOp)} `;
  } else if (a === null) {
    // First operator after typing first number
    a = current;
    expr = `${trimNum(a)} ${symbol(nextOp)} `;
  } else {
    // Changing operator before typing the next number
    expr = `${trimNum(a)} ${symbol(nextOp)} `;
  }

  op = nextOp;
  overwrite = true;
  justComputed = false;
  refreshUI();
}

// Compute (=)
function compute() {
  if (a === null || op === null) return;

  if (b === null) b = parseFloat(buffer);

  const res = operate(a, b, op);
  if (res === "Error") {
    setDisplay("Error");
    resetAll();
    return;
  }

  // Show full expression above and result in main display
  expr = `${trimNum(a)} ${symbol(op)} ${trimNum(b)} =`;
  buffer = String(res);
  setExpr(expr);
  setDisplay(buffer);

  // Prepare state for possible next operations with result
  a = (typeof res === "number" && Number.isFinite(res)) ? res : null;
  b = null;
  op = null;
  overwrite = true;
  justComputed = true;
}

// Clear (AC)
function clearAll() {
  resetAll();
}

// Delete (DEL)
function delOne() {
  // If we're in overwrite mode (just pressed an op or =), there's nothing to delete
  if (overwrite) return;

  if (buffer.length <= 1 || (buffer.length === 2 && buffer.startsWith('-'))) {
    buffer = "0";
    overwrite = true;
  } else {
    buffer = buffer.slice(0, -1);
  }
  refreshUI();
}

// --- Helpers ---
function operate(x, y, operator) {
  switch (operator) {
    case '+': return x + y;
    case '-': return x - y;
    case '*': return x * y;
    case '/': return y === 0 ? "Error" : x / y;
    case '%': return x % y;
    default: return x;
  }
}

function symbol(op) {
  // Pretty print operator symbols for the expression line
  switch (op) {
    case '*': return '×';
    case '/': return '÷';
    default:  return op;
  }
}

function trimNum(n) {
  // Keep nice short numbers for the expression line
  const s = String(n);
  return s.length > 16 ? Number(n).toPrecision(10) : s;
}

// Clicks
document.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;

  if (btn.dataset.num !== undefined) inputNumber(btn.dataset.num);
  else if (btn.dataset.op) chooseOp(btn.dataset.op);
  else if (btn.dataset.action === 'equals') compute();
  else if (btn.dataset.action === 'clear') clearAll();
  else if (btn.dataset.action === 'del') delOne();
});

// Keyboard
document.addEventListener('keydown', (e) => {
  if (/\d/.test(e.key)) inputNumber(e.key);
  else if (e.key === '.') inputNumber('.');
  else if (['+', '-', '*', '/', '%'].includes(e.key)) chooseOp(e.key);
  else if (e.key === 'Enter' || e.key === '=') { e.preventDefault(); compute(); }
  else if (e.key === 'Backspace') delOne();
  else if (e.key.toLowerCase() === 'c') clearAll();
});

// Init
refreshUI();

