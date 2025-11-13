// productos.js
// Carga productos.json y llena el <select> solo una vez.
// Expone window.productosDisponibles para que otros scripts lo usen.
(() => {
  const JSON_PATH = "./JSON/productos.json";
  document.addEventListener("DOMContentLoaded", () => {
    const selectProducto = document.getElementById("selectProducto");
    if (!selectProducto) return;

    // Si ya tiene opciones además del placeholder, evitamos volver a poblar.
    const yaCargado = selectProducto.options.length > 1;
    if (yaCargado) {
      // Pero RECONSTRUIMOS window.productosDisponibles a partir de las opciones ya presentes
      // para asegurarnos de que otros módulos (carrito.js) tengan acceso a los precios.
      const productosDesdeOptions = Array.from(selectProducto.options)
        .filter(opt => opt.value) // ignorar placeholder si tiene value vacío
        .map(opt => ({
          nombre: opt.value,
          precio: opt.dataset && opt.dataset.precio ? Number(opt.dataset.precio) : 0
        }));
      window.productosDisponibles = productosDesdeOptions;
      console.log("Productos ya cargados — reconstruyendo window.productosDisponibles desde <option>.");
      return;
    }

    fetch(JSON_PATH)
      .then(res => res.json())
      .then(data => {
        window.productosDisponibles = data || [];
        if (!selectProducto) return;
        // Mantiene la opción por defecto y agrega las demás
        data.forEach(prod => {
          const option = document.createElement("option");
          option.value = prod.nombre;
          option.dataset.precio = prod.precio;
          option.textContent = `${prod.nombre} - $${Number(prod.precio).toLocaleString("es-AR")}`;
          selectProducto.appendChild(option);
        });
      })
      .catch(err => {
        console.error("Error cargando productos.json", err);
        window.productosDisponibles = [];
      });
  });
})();
