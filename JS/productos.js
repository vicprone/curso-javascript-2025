
(() => {
  const JSON_PATH = "./JSON/productos.json";
  document.addEventListener("DOMContentLoaded", () => {
    const selectProducto = document.getElementById("selectProducto");
    if (!selectProducto) return;

    const yaCargado = selectProducto.options.length > 1;
    if (yaCargado) {
      
      const productosDesdeOptions = Array.from(selectProducto.options)
        .filter(opt => opt.value) 
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
