// carrito.js
// Lógica del carrito, UI y persistencia. Depende de window.productosDisponibles (poblado por productos.js).
(() => {
  const STORAGE_KEY = "carrito";

  document.addEventListener("DOMContentLoaded", () => {
    const selectProducto = document.getElementById("selectProducto");
    const cantidadInput = document.getElementById("cantidad");
    const subtotalSpan = document.getElementById("subtotal");
    const btnAgregar = document.getElementById("btnAgregar");
    const listaCarrito = document.getElementById("listaCarrito");
    const totalCarritoSpan = document.getElementById("totalCarrito");
    const btnFinalizar = document.getElementById("btnFinalizar");
    const btnHistorial = document.getElementById("btnHistorial");

    let carrito = [];

    // --- FUNCIONES BASE ---
    function cargarCarrito() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return parsed.map(item => {
          if (item && (item.precio !== undefined && item.precio !== null)) return item;
          const cantidad = Number(item?.cantidad) || 1;
          const subtotal = Number(item?.subtotal) || 0;
          const precioInferido = cantidad > 0 ? Number((subtotal / cantidad).toFixed(2)) : 0;
          return { ...item, precio: precioInferido };
        });
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
    }

    function guardarCarrito() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
    }

    function actualizarSubtotalUI() {
      const option = selectProducto?.selectedOptions?.[0];
      const precio = option?.dataset?.precio ? Number(option.dataset.precio) : 0;
      const cantidad = Number(cantidadInput?.value) || 0;
      if (subtotalSpan) subtotalSpan.textContent = (precio * cantidad).toLocaleString("es-AR");
    }

    function actualizarCarritoUI() {
      carrito = cargarCarrito();
      if (!listaCarrito) return;
      listaCarrito.innerHTML = "";
      let total = 0;

      carrito.forEach((item, index) => {
        // Si el precio no está definido (null/undefined/NaN), lo inferimos y lo guardamos
        let precioUnitario;
        if (item.precio !== undefined && item.precio !== null && !isNaN(Number(item.precio))) {
          precioUnitario = Number(item.precio);
        } else if (item.cantidad && item.cantidad > 0) {
          precioUnitario = Number(item.subtotal / item.cantidad);
          // actualizar el item para que persista el precio inferido
          item.precio = Number(precioUnitario.toFixed(2));
        } else {
          precioUnitario = 0;
        }

        total += Number(item.subtotal) || 0;

        const precioStr = Number(precioUnitario).toLocaleString("es-AR");
        const subtotalStr = Number(item.subtotal).toLocaleString("es-AR");

        const li = document.createElement("li");
        li.className = "d-flex justify-content-between align-items-center mb-2 p-2";
        li.style.background = "#fff";
        li.style.border = "1px solid #c995c6";
        li.style.borderRadius = "8px";

        li.innerHTML = `
          <div>
            <span style="display:block; font-weight:600;">${item.producto}</span>
            <small>Cantidad: ${item.cantidad} • Precio unitario: $${precioStr}</small>
          </div>
          <div style="text-align:right;">
            <div>$${subtotalStr}</div>
            <button data-index="${index}" class="btnEliminar" style="border:none;background:transparent;cursor:pointer;margin-top:6px;">❌</button>
          </div>
        `;

        listaCarrito.appendChild(li);
      });

      // Guardamos cualquier precio inferido durante el render
      guardarCarrito();

      if (totalCarritoSpan) totalCarritoSpan.textContent = total.toLocaleString("es-AR");

      // Botones eliminar
      document.querySelectorAll(".btnEliminar").forEach(btn => {
        btn.addEventListener("click", e => {
          const i = Number(e.target.dataset.index);
          carrito.splice(i, 1);
          guardarCarrito();
          actualizarCarritoUI();
        });
      });
    }

    // --- EVENTOS ---
    selectProducto?.addEventListener("change", actualizarSubtotalUI);
    cantidadInput?.addEventListener("input", actualizarSubtotalUI);

    // AGREGAR PRODUCTO MANUALMENTE
    btnAgregar?.addEventListener("click", e => {
      e.preventDefault();
      carrito = cargarCarrito();

      const producto = selectProducto?.value;
      const option = selectProducto?.selectedOptions?.[0];
      const precio = option?.dataset?.precio ? Number(option.dataset.precio) : 0;
      const cantidad = Number(cantidadInput?.value) || 0;

      if (!producto) {
        Swal.fire({
          title: 'Ups... 🐾',
          text: 'Por favor seleccioná un producto antes de agregarlo al carrito.',
          icon: 'warning',
          confirmButtonColor: '#c995c6'
        });
        return;
      }

      if (cantidad < 1) {
        Swal.fire({
          title: 'Cantidad inválida ⚠️',
          text: 'La cantidad debe ser al menos 1.',
          icon: 'info',
          confirmButtonColor: '#c995c6'
        });
        return;
      }

      const subtotal = precio * cantidad;
      const existente = carrito.find(i => i.producto === producto);

      if (existente) {
        existente.cantidad += cantidad;
        existente.subtotal += subtotal;
        // si no tenía precio, intentamos asignarlo
        if (existente.precio === undefined || existente.precio === null) existente.precio = precio;
      } else {
        carrito.push({ producto, cantidad, subtotal, precio });
      }

      guardarCarrito();
      actualizarCarritoUI();

      Swal.fire({
        title: 'Producto agregado 🛒',
        text: `${producto} se añadió al carrito.`,
        icon: 'success',
        confirmButtonColor: '#c995c6',
        timer: 1500,
        showConfirmButton: false
      });

      if (selectProducto) selectProducto.value = "";
      if (cantidadInput) cantidadInput.value = 1;
      if (subtotalSpan) subtotalSpan.textContent = "0";
    });

    // AGREGAR DESDE LAS CARDS
    const botonesCards = document.querySelectorAll(".btnAgregarDesdeCard");
    botonesCards.forEach(btn => {
      btn.addEventListener("click", e => {
        e.preventDefault();
        const productoSeleccionado = btn.dataset.producto;

        // 1) intentar desde productosDisponibles (poblado por productos.js)
        let productos = window.productosDisponibles || [];
        let productoInfo = productos.find(p => p.nombre === productoSeleccionado);
        let precio = productoInfo ? Number(productoInfo.precio) : null;

        // 2) fallback: buscar en las <option> del select (tu HTML ya trae data-precio)
        if (precio === null || Number.isNaN(precio)) {
          const option = Array.from(selectProducto.options).find(opt => opt.value === productoSeleccionado);
          if (option && option.dataset && option.dataset.precio) {
            precio = Number(option.dataset.precio);
          }
        }

        // 3) fallback: data-precio directo en el botón (si lo agregás)
        if ((precio === null || Number.isNaN(precio)) && btn.dataset.precio) {
          precio = Number(btn.dataset.precio);
        }

        // 4) si nada, forzar 0
        if (precio === null || Number.isNaN(precio)) precio = 0;

        carrito = cargarCarrito();

        const existente = carrito.find(item => item.producto === productoSeleccionado);
        if (existente) {
          existente.cantidad += 1;
          existente.subtotal += precio;
          if (existente.precio === undefined || existente.precio === null) existente.precio = precio;
        } else {
          carrito.push({ producto: productoSeleccionado, cantidad: 1, subtotal: precio, precio });
        }

        guardarCarrito();
        actualizarCarritoUI();

        Swal.fire({
          title: 'Producto agregado 🛒',
          text: `${productoSeleccionado} se añadió al carrito.`,
          icon: 'success',
          confirmButtonColor: '#c995c6',
          timer: 1500,
          showConfirmButton: false
        });
      });
    });

    // FINALIZAR PEDIDO
    if (btnFinalizar) {
      btnFinalizar.addEventListener("click", () => {
        carrito = cargarCarrito();

        if (!carrito || carrito.length === 0) {
          Swal.fire({
            title: 'Tu carrito está vacío 🐾',
            icon: 'info',
            confirmButtonColor: '#c995c6'
          });
          return;
        }

        const prev = JSON.parse(localStorage.getItem("datosCliente")) || {};
        const nombreVal = prev.nombre || "";
        const emailVal = prev.email || "";
        const direccionVal = prev.direccion || "";

        let resumenHTML = `
          <div style="text-align:left; margin-bottom:1rem;">
            <h4 style="color:#754d73;">🛒 Resumen del pedido</h4>
            <ul style="list-style:none; padding-left:0; margin:0;">
        `;
        let total = 0;
        carrito.forEach(item => {
          resumenHTML += `<li>${item.producto} x${item.cantidad} — <strong>$${item.subtotal.toLocaleString("es-AR")}</strong></li>`;
          total += item.subtotal;
        });
        resumenHTML += `
            </ul>
            <p style="margin-top:10px; font-weight:600;">Total: $${total.toLocaleString("es-AR")}</p>
          </div>
          <hr>
          <input id="swal-nombre" class="swal2-input" placeholder="Nombre y apellido" value="${nombreVal}">
          <input id="swal-email" type="email" class="swal2-input" placeholder="Correo electrónico" value="${emailVal}">
          <input id="swal-direccion" class="swal2-input" placeholder="Domicilio de entrega" value="${direccionVal}">
        `;

        Swal.fire({
          title: 'Datos para el envío 🚚',
          html: resumenHTML,
          focusConfirm: false,
          confirmButtonText: 'Confirmar pedido',
          confirmButtonColor: '#754d73',
          showCancelButton: true,
          cancelButtonText: 'Cancelar',
          cancelButtonColor: '#c995c6',
          width: 600,
          preConfirm: () => {
            const nombre = document.getElementById("swal-nombre").value.trim();
            const email = document.getElementById("swal-email").value.trim();
            const direccion = document.getElementById("swal-direccion").value.trim();
            if (!nombre || !email || !direccion) {
              Swal.showValidationMessage("Por favor completá todos los campos");
              return false;
            }
            return { nombre, email, direccion };
          }
        }).then(result => {
          if (result.isConfirmed && result.value) {
            const { nombre, email, direccion } = result.value;
            localStorage.setItem("datosCliente", JSON.stringify({ nombre, email, direccion }));

            const historial = JSON.parse(localStorage.getItem("historialPedidos")) || [];
            historial.push({
              pedido: carrito,
              total,
              fecha: new Date().toLocaleString(),
              cliente: { nombre, email, direccion }
            });
            localStorage.setItem("historialPedidos", JSON.stringify(historial));

            carrito = [];
            guardarCarrito();
            localStorage.removeItem(STORAGE_KEY);
            actualizarCarritoUI();

            Swal.fire({
              title: '¡Pedido confirmado! 💜',
              html: `
                <p>Gracias, <strong>${nombre}</strong> 🐾</p>
                <p>Te enviaremos un correo a <strong>${email}</strong></p>
                <p>El envío llegará a: <strong>${direccion}</strong></p>
              `,
              icon: 'success',
              confirmButtonColor: '#c995c6'
            });
          }
        });
      });
    }

    // HISTORIAL
    if (btnHistorial) {
      btnHistorial.addEventListener("click", () => {
        const historial = JSON.parse(localStorage.getItem("historialPedidos")) || [];

        if (historial.length === 0) {
          Swal.fire({
            title: 'Sin pedidos 🐾',
            text: 'Todavía no realizaste ningún pedido.',
            icon: 'info',
            confirmButtonColor: '#c995c6'
          });
          return;
        }

        let htmlHistorial = `<div style="text-align:left; max-height:400px; overflow-y:auto;">`;
        historial.slice().reverse().forEach((pedido, i) => {
          htmlHistorial += `
            <div style="margin-bottom:1rem; border-bottom:1px solid #eee; padding-bottom:0.5rem;">
              <h4 style="color:#754d73; margin-bottom:0.3rem;">Pedido #${historial.length - i}</h4>
              <p style="margin:0; font-size:0.9rem;">📅 ${pedido.fecha}</p>
              <ul style="list-style:none; padding-left:0; margin-top:0.5rem;">
                ${pedido.pedido.map(p => `<li>${p.producto} x${p.cantidad} — $${p.subtotal.toLocaleString("es-AR")}</li>`).join("")}
              </ul>
              <p style="font-weight:600;">💰 Total: $${pedido.total.toLocaleString("es-AR")}</p>
              <p style="margin:0;">👤 ${pedido.cliente.nombre}</p>
              <p style="margin:0;">📧 ${pedido.cliente.email}</p>
              <p style="margin:0;">🏠 ${pedido.cliente.direccion}</p>
            </div>
          `;
        });
        htmlHistorial += `</div>`;

        Swal.fire({
          title: 'Historial de pedidos 📦',
          html: htmlHistorial,
          width: 600,
          confirmButtonColor: '#c995c6',
          confirmButtonText: 'Cerrar'
        });
      });
    }

    // Inicializar vista
    actualizarCarritoUI();
  });
})();
