class MorningFeedbackDialog {
    constructor() {
        this.dialog = null;
        this.init();
    }

    init() {
        var self = this;
        // Check if current time is between specific timeframes
        frappe.call({
            method: "phamos.phamos.doctype.have_a_great_day.have_a_great_day.get_timeframes",
            args: {},
            callback: function(response) {
                if (response.message) {
                    var timeframes = response.message.split(',').map(function(tf) {
                        return tf.trim(); // Clean up spaces around each timeframe
                    });

                    // Check if current time matches any of the fetched timeframes
                    var currentTime = new Date();
                    var currentHour = currentTime.getHours();
                    console.log(currentHour)
                    console.log(timeframes)
                    // Function to check if current hour falls within a specific timeframe
                    function isInTimeframe(tf) {
                        var parts = tf.split(' to ');
                        if (parts.length === 2) {
                            var startHour = parseInt(parts[0], 10);
                            var endHour = parseInt(parts[1], 10);
                            return currentHour >= startHour && currentHour <= endHour;
                        }
                        return false;
                    }

                    // Check each timeframe
                    var showDialog = timeframes.some(isInTimeframe);

                    // Show dialog box if current time matches any timeframe
                    if (showDialog) {
                        self.showFeedbackDialog(); // Call method to show the dialog box
                    } else {
                        console.log("Current time does not match any timeframe to show the dialog.");
                    }
                } else {
                    console.error("No timeframes found.");
                }
            }
        });
    }

    showFeedbackDialog() {
       
        var self = this;
        // Ensure current time is between 8 am to 9 pm
        
            frappe.db.get_value("phamos Settings", {}, "is_employee_feedback", function(value) {
                if (value && value.is_employee_feedback == 1) {
                    frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name", function(value_user) {
                        if (value_user && value_user.name) {
                            self.dialog_box();
                        } else {
                            //frappe.throw(__("Employee not found for the current user."));
                            console.log("Employee not found for the current user.");
                        }
                    });
                } else if (value && value.is_employee_feedback == 0) {
                    self.dialog_box();
                }
            });
       
    }

    dialog_box() {
        // Function to show the dialog box with fields
        this.dialog = new frappe.ui.Dialog({
            title: __("Have a Great Day!"),
            fields: [
                {
                    fieldtype: "Small Text",
                    label: __("What are you most looking forward to today?"),
                    fieldname: "what_are_you_most_looking_forward_today",
                    in_list_view: 1,
                    reqd: 1, // Required field
                },
                {
                    fieldtype: "Column Break",
                },
                {
                    fieldtype: "Small Text",
                    label: __("What challenge will you tackle today?"),
                    fieldname: "what_challenge_will_you_tackle_today",
                    in_list_view: 1,
                    reqd: 1, // Required field
                },
            ],
            primary_action_label: __("Save"),
            primary_action: (values) => {
                this.submit(values);
                this.dialog.hide();
            }
        });

        this.dialog.$wrapper.find('.modal-dialog').css('max-width', '500px');
        this.dialog.show();
    }

    submit(values) {
        // Handle form submission or call backend method
        this.createRecord(values.what_are_you_most_looking_forward_today, values.what_challenge_will_you_tackle_today);
        // Hide the dialog after submission
        this.dialog.hide();
    }

    createRecord(lookingForward, todaysChallenge) {
        // Example: Use frappe.call or any backend API to create a record
        frappe.call({
            method: "phamos.phamos.doctype.have_a_great_day.have_a_great_day.create_todays_feedback",
            args: {
                lookingForward: lookingForward,
                todaysChallenge: todaysChallenge
            },
            callback: function(response) {
                frappe.msgprint(__("Feedback submitted successfully!"));
            }
        });
    }
}

// Instantiate the dialog class when the document is ready
$(document).on('app_ready', function() {
    new MorningFeedbackDialog();
});
