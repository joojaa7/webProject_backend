"use strict";

import { tablesUrl } from "./variables.js";
import { reservationsUrl } from "./variables.js";
import { customersUrl } from "./variables.js";

let currentTableId = 1;
const initialDate = new Date();
loadTablesAndReservations(initialDate);

document.addEventListener("DOMContentLoaded", () => {
  const addForm = document.getElementById("addTableForm");
  const deleteForm = document.getElementById("deleteTableForm");

  document
    .getElementById("toggleAddFormButton")
    .addEventListener("click", () => {
      addForm.style.display =
        addForm.style.display === "none" || addForm.style.display === ""
          ? "block"
          : "none";
    });

  document
    .getElementById("toggleDeleteFormButton")
    .addEventListener("click", () => {
      deleteForm.style.display =
        deleteForm.style.display === "none" || deleteForm.style.display === ""
          ? "block"
          : "none";
    });
});

document
  .getElementById("loadReservationsForDate")
  .addEventListener("click", async function () {
    const date = document.getElementById("reservationDate").value;
    if (!date) {
      alert("Please select a date.");
      return;
    }
    displayTableReservations(currentTableId, date);
    console.log("currentTableId and date in click log:", currentTableId, date);
    document.getElementById(
      "currentTable"
    ).textContent = `Details for table: ${currentTableId}`;
  });

// Helper function to format JavaScript Date object to MySQL datetime format
function formatToMySQLDateTime(date) {
  return date.toISOString().replace("T", " ").substring(0, 19);
}

// Helper function to clear the form fields
function clearForm() {
  const form = document.querySelector("#reservationModifications form");
  if (form) {
    form.reset(); // Resets all form fields to their initial values
  }
}

// Helper function to format reservation time
const formatReservationTime = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// helper function to generate time slots for reservations listing
function generateTimeSlots() {
  const slots = [];
  for (let hour = 8; hour < 21; hour++) {
    const time = `${hour.toString().padStart(2, "0")}:00`; // two-digit format
    slots.push(time);
  }
  return slots;
}

// click handlers for table elements
function setupTableClickHandlers() {
  const tables = document.querySelectorAll(".table");
  tables.forEach((table) => {
    table.addEventListener("click", function () {
      const tableId = this.textContent.match(/Table ID: (\d+),/)[1];
      document.getElementById(
        "currentTable"
      ).textContent = `Details for table: ${tableId}`;
      const date = document.getElementById("reservationDate").value;
      displayTableReservations(tableId, date);
    });
  });
}

// Calendar buttons
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("previousDayBtn")
    .addEventListener("click", () => changeDate(-1));

  document
    .getElementById("nextDayBtn")
    .addEventListener("click", () => changeDate(1));

  updateDateInput(initialDate);
});

function changeDate(dayChange) {
  const dateInput = document.getElementById("reservationDate");
  const currentDate = new Date(dateInput.value);
  currentDate.setDate(currentDate.getDate() + dayChange);
  const dateString = currentDate.toISOString().split("T")[0];
  dateInput.value = dateString; // Set the input to the new date string in YYYY-MM-DD format

  // Retrieve the current table ID from the text content
  const currentTableText = document.getElementById("currentTable").textContent;
  const tableIdMatch = currentTableText.match(/table: (\d+)/);
  if (tableIdMatch && tableIdMatch[1]) {
    const tableId = tableIdMatch[1]; // Extracted table ID
    console.log("Current table ID:", tableId);
    console.log("New date:", dateString);
    displayTableReservations(tableId, dateString);
  } else {
    alert("Please select a table");
    console.error("No table ID found or table is not selected");
  }
}

function updateDateInput(date) {
  const dateStr = date.toISOString().split("T")[0];
  document.getElementById("reservationDate").value = dateStr;
}

// Function to add a new table to the database
const addTable = async () => {
  const capacityInput = document.getElementById("tableCapacity");
  const locationInput = document.getElementById("tableLocation");

  const capacity = capacityInput.value;
  const location = locationInput.value;
  const postData = {
    capacity: parseInt(capacity, 10),
    location,
  };

  try {
    const response = await fetch(tablesUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    if (!response.ok) {
      throw new Error("Failed to add new table: " + response.statusText);
    }
    const addedTable = await response.json();
    alert("New table added: ID " + addedTable.id);
    loadTablesAndReservations(initialDate);

    // Clear the input fields after successful submission
    capacityInput.value = "";
    locationInput.value = "";
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};

document.getElementById("addTableForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addTable();
});

const deleteTable = async () => {
  const tableId = document.getElementById("tableId").value;
  console.log(tableId);
  const url = `${tablesUrl}/${tableId}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete table: " + response.statusText);
    }
    alert("Table deleted successfully!");
    loadTablesAndReservations(initialDate);
  } catch (error) {
    console.error("Error deleting table:", error);
    alert("Error deleting table: " + error.message);
  }
};

document
  .getElementById("submitDeleteTableButton")
  .addEventListener("click", (event) => {
    event.preventDefault();
    deleteTable();
  });

// create table elements
function loadTablesAndReservations(date) {
  const url = `${tablesUrl}?date=${date.toISOString().split("T")[0]}`;
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch tables: " + response.statusText);
      }
      return response.json();
    })
    .then((tables) => {
      const tablesGrid = document.getElementById("tablesGrid");
      tablesGrid.innerHTML = "";
      tables.forEach((table) => {
        const tableDiv = document.createElement("div");
        tableDiv.className = "table";
        tableDiv.textContent = `Table ID: ${table.table_id}, Seats: ${table.capacity}, Location: ${table.location}`;
        tableDiv.onclick = () => {
          document.getElementById(
            "currentTable"
          ).textContent = `Details for table: ${table.table_id}`;
          currentTableId = table.table_id;
          displayTableReservations(currentTableId, date);
        };
        tablesGrid.appendChild(tableDiv);
      });
      setupTableClickHandlers();
    })
    .catch((error) => {
      console.error("Error loading tables:", error);
      tablesGrid.textContent = "Error loading tables.";
    });
}


function createAddReservationForm(timeSlot) {
  const modificationsDiv = document.getElementById("reservationModifications");
  modificationsDiv.innerHTML = "";

  const form = document.createElement("form");

  const customerNameInput = document.createElement("input");
  customerNameInput.type = "text";
  customerNameInput.placeholder = "Customer Name";
  customerNameInput.required = true;
  form.appendChild(customerNameInput);

  const customerContactInfoInput = document.createElement("input");
  customerContactInfoInput.type = "email";
  customerContactInfoInput.placeholder = "Contact Info";
  customerContactInfoInput.required = true;
  form.appendChild(customerContactInfoInput);

  const numberOfGuestsInput = document.createElement("input");
  numberOfGuestsInput.type = "number";
  numberOfGuestsInput.placeholder = "Number of Guests";
  numberOfGuestsInput.required = true;
  form.appendChild(numberOfGuestsInput);

  form.onsubmit = async (e) => {
    e.preventDefault();
    const date = document.getElementById("reservationDate").value;
    const numberOfGuests = numberOfGuestsInput.value;

    try {
      const { customer_id } = await addCustomer(
        customerNameInput.value,
        customerContactInfoInput.value
      );
      if (!customer_id) {
        throw new Error("No customer ID returned");
      }

      // Proceed to add the reservation with the retrieved customer ID
      addReservation(timeSlot, customer_id, numberOfGuests, date);
    } catch (error) {
      console.error("Failed to add customer or reservation:", error);
    }
  };

  // Add reservation button
  const addButton = document.createElement("button");
  addButton.type = "submit";
  addButton.textContent = "Add Reservation";
  form.appendChild(addButton);

  // Close button
  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.onclick = () => {
    modificationsDiv.style.display = "none";
  };
  form.appendChild(closeButton);

  // Append the form to the modificationsDiv

  modificationsDiv.appendChild(form);
  modificationsDiv.style.display = "block";
}

// modify existing reservation
async function modifyReservationForm(reservationId) {
  try {
    const userDetails = await fetchCustomerByReservationId(reservationId);
    if (userDetails) {
      displayModifyReservationForm(userDetails, reservationId);
    } else {
      throw new Error(
        "No customer details found for the given reservation ID."
      );
    }
  } catch (error) {
    console.error("Error modifying reservation:", error);
    alert("Error modifying reservation: " + error.message);
  }
}

// helper function for modifyReservationForm to fetch customer details by reservation ID
async function fetchCustomerByReservationId(reservationId) {
  const response = await fetch(`${reservationsUrl}customer/${reservationId}`);
  if (!response.ok) {
    throw new Error("Failed to fetch customer details");
  }
  return await response.json();
}

function displayModifyReservationForm(userDetails, reservationId) {
  const modificationsDiv = document.getElementById("reservationModifications");
  modificationsDiv.innerHTML = ""; 

  const form = document.createElement("form");

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.value = userDetails.name;
  nameInput.placeholder = "Customer Name";

  const contactInfoInput = document.createElement("input");
  contactInfoInput.type = "text";
  contactInfoInput.value = userDetails.contact_info;
  contactInfoInput.placeholder = "Contact Info";

  const numberOfGuestsInput = document.createElement("input");
  numberOfGuestsInput.type = "number";
  numberOfGuestsInput.value = userDetails.number_of_guests;
  numberOfGuestsInput.placeholder = "Number of Guests";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.textContent = "Close";
  closeButton.onclick = () => {
    modificationsDiv.style.display = "none";
  };

  const saveButton = document.createElement("button");
  saveButton.type = "submit";
  saveButton.textContent = "Save Changes";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.textContent = "Delete Reservation";
  deleteButton.onclick = () => deleteReservation(reservationId);

  form.appendChild(nameInput);
  form.appendChild(contactInfoInput);
  form.appendChild(numberOfGuestsInput);
  form.appendChild(saveButton);
  form.appendChild(closeButton);
  form.appendChild(deleteButton);

  modificationsDiv.appendChild(form);
  modificationsDiv.style.display = "block";

  form.onsubmit = async (e) => {
    e.preventDefault();
    try {
      console.log(
        "calling updateReservation with: ",
        reservationId,
        nameInput.value,
        contactInfoInput.value
      );
      await updateCustomer({
        customer_id: userDetails.customer_id,
        name: nameInput.value,
        contact_info: contactInfoInput.value,
      });

      await updateReservation(reservationId, numberOfGuestsInput.value);

      alert("Reservation updated successfully!");
      modificationsDiv.style.display = "none";
      const currentDate = document.getElementById("reservationDate").value;
      displayTableReservations(currentTableId, currentDate);
    } catch (error) {
      console.error("Error updating reservation:", error);
      alert("Error updating reservation: " + error.message);
    }
  };
}

function addReservation(timeSlot, customerId, numberOfGuests, date) {
  const startTime = new Date(`${date}T${timeSlot}:00Z`);
  const endTime = new Date(startTime.getTime() + 60 * 60000);

  // Format dates to MySQL acceptable format
  const startTimeFormatted = formatToMySQLDateTime(startTime);
  const endTimeFormatted = formatToMySQLDateTime(endTime);

  fetch(reservationsUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      table_id: currentTableId,
      customer_id: customerId,
      number_of_guests: numberOfGuests,
      start_time: startTimeFormatted,
      end_time: endTimeFormatted,
      status: "Confirmed", 
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to add reservation");
      }
      return response.json();
    })
    .then((data) => {
      alert("Reservation added successfully!");
      displayTableReservations(currentTableId, new Date(date)); // Refresh the reservation details
      clearForm();
    })
    .catch((error) => {
      console.error("Error adding reservation:", error);
      alert("Error adding reservation: " + error.message);
    });
}

async function deleteReservation(reservationId) {
  console.log(
    "url in deleteresevation: ",
    `${reservationsUrl}/${reservationId}`
  );
  try {
    const response = await fetch(`${reservationsUrl}/${reservationId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error("Failed to delete reservation: " + response.statusText);
    }
    alert("Reservation deleted successfully!");
    const currentDate = document.getElementById("reservationDate").value;
    const currentTableText =
      document.getElementById("currentTable").textContent;
    const tableIdMatch = currentTableText.match(/table: (\d+)/);
    console.log("in deleteReservations: ", tableIdMatch, currentDate);
    displayTableReservations(tableIdMatch, currentDate);
  } catch (error) {
    console.error("Error deleting reservation:", error);
    alert("Error deleting reservation: " + error.message);
  }
}

async function updateReservation(reservationId, numberOfGuests) {
  try {
    const response = await fetch(`${reservationsUrl}${reservationId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        number_of_guests: numberOfGuests,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update reservation: ${response.statusText}`);
    }

    console.log("Reservation updated successfully");
    return await response.json();
  } catch (error) {
    console.error("Error updating reservation:", error.message);
    throw error;
  }
}

async function updateCustomer(customerDetails) {
  console.log("updatecustomer called");
  try {
    const response = await fetch(
      `${customersUrl}/${customerDetails.customer_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: customerDetails.name,
          contact_info: customerDetails.contact_info,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to update customer: ${response.statusText}`);
    }

    console.log("Customer updated successfully");
    return await response.json(); // Assuming API returns updated customer details
  } catch (error) {
    console.error("Error updating customer:", error.message);
    throw error;
  }
}

function displayTableReservations(tableId, dateString) {
  console.log("displayTableReservations called");
  // Convert dateString to a Date object first
  const date = new Date(dateString);
  const dateStr = date.toISOString().split("T")[0];
  const reservationDetails = document.getElementById("reservationDetails");
  const url = `${reservationsUrl}/${tableId}?date=${dateStr}`;
  const timeSlots = generateTimeSlots();

  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch reservations: " + response.statusText);
      }
      return response.json();
    })
    .then((reservations) => {
      reservationDetails.innerHTML = ""; // Clear previous reservation details
      timeSlots.forEach((slot) => {
        const slotDiv = document.createElement("div");
        const res = reservations.find((r) => {
          const reservationHour = new Date(r.start_time).getHours();
          const slotHour = parseInt(slot.split(":")[0]);
          return reservationHour === slotHour;
        });
        if (res) {
          console.log(res.start_time);
          slotDiv.textContent = `${formatReservationTime(
            res.start_time
          )} to ${formatReservationTime(res.end_time)} - Status: ${
            res.status
          }, Guests: ${res.number_of_guests}, Customer ID: ${res.customer_id}`;
          slotDiv.className = "reserved";
          slotDiv.onclick = () => modifyReservationForm(res.reservation_id);
        } else {
          slotDiv.textContent = `${slot} - FREE`;
          slotDiv.className = "free";
          slotDiv.onclick = () => createAddReservationForm(slot);
        }
        reservationDetails.appendChild(slotDiv);
      });
    })
    .catch((error) => {
      console.error("Error loading reservations:", error);
      reservationDetails.textContent = "Error loading reservations.";
    });
}

const addCustomer = async (name, email) => {
  const postData = {
    customer_name: name,
    contact_info: email,
  };
  console.log(postData);
  try {
    const response = await fetch(customersUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });
    if (!response.ok) {
      throw new Error("Failed to add new customer: " + response.statusText);
    }
    const addedCustomer = await response.json();

    return addedCustomer;
  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};
