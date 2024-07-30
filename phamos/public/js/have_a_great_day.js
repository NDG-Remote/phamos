class MorningFeedbackDialog {
    constructor() {
        this.dialog = null;
        this.init();
    }

    init() {
        var self = this;
        // Function to convert time string "HH:MM:SS" to total seconds
        function timeToSeconds(timeStr) {
            var parts = timeStr.split(':');
            var hours = parseInt(parts[0], 10) || 0;
            var minutes = parseInt(parts[1], 10) || 0;
            var seconds = parseInt(parts[2], 10) || 0;
            return hours * 3600 + minutes * 60 + seconds;
        }
    
        // Check if current time is between specific timeframes
        frappe.call({
            method: "phamos.phamos.doctype.have_a_great_day.have_a_great_day.get_user_time",
            args: { user: frappe.session.user },
            callback: function(response) {
                if(response.message) {
                    // Extract time strings
                    var userTimeStr = response.message.user_time_str || "00:00:00";
                    var fromTimeStr = response.message.from_time || "00:00:00";
                    var tillTimeStr = response.message.till_time || "23:59:59";
                    
                    // Convert time strings to seconds
                    var userTimeSeconds = timeToSeconds(userTimeStr);
                    var fromTimeSeconds = timeToSeconds(fromTimeStr);
                    var tillTimeSeconds = timeToSeconds(tillTimeStr);
    
                    console.log("User time (seconds):", userTimeSeconds);
                    console.log("From time (seconds):", fromTimeSeconds);
                    console.log("Till time (seconds):", tillTimeSeconds);
    
                    // Compare the total seconds
                    if (fromTimeSeconds <= userTimeSeconds && userTimeSeconds <= tillTimeSeconds) {
                        console.log("User time is within range. Showing feedback dialog.");
                        self.showFeedbackDialog();
                    } else {
                        console.log("User time is not within the range.");
                    }
                } else {
                    console.error("Failed to fetch user time.");
                }
            },
            error: function(error) {
                console.error("Error:", error);
            }
        });
    }
    
        
        /*
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
        }); */
    

    showFeedbackDialog() {
        
        var self = this;
        // Ensure current time is between 8 am to 9 pm
        const user_date_fmt = frappe.datetime.get_user_date_fmt().toUpperCase();
        const user_time_fmt = frappe.datetime.get_user_time_fmt();
        console.log("user_date_fmt")
        console.log(user_date_fmt)
        console.log(user_time_fmt)
            frappe.db.get_value("phamos Settings", {}, "is_employee_feedback", function(value) {
                if (value && value.is_employee_feedback == 1) {
                    frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name", function(value_user) {
                        if (value_user && value_user.name) {
                            var today_date = frappe.datetime.nowdate();  // Get today's date in YYYY-MM-DD format
                            frappe.db.get_value("Have a Great Day", {
                                "user": frappe.session.user,
                                "creation_date": today_date  // Directly compare with today's date
                            }, "name", function(value_feedback) {
                            if (value_feedback && value_feedback.name) {
                                // Feedback exists for today
                            } else {
                                // No feedback found for today
                                self.dialog_box(); // Show dialog box if feedback for today does not exist
                            }
                            });
                        } else {
                            //frappe.throw(__("Employee not found for the current user."));
                            
                        }
                    });
                } else if (value && value.is_employee_feedback == 0) {
                    var today_date = frappe.datetime.nowdate();  // Get today's date in YYYY-MM-DD format
                    frappe.db.get_value("Have a Great Day", {
                        "user": frappe.session.user,
                        "creation_date": today_date  // Directly compare with today's date
                    }, "name", function(value_feedback) {
                    if (value_feedback && value_feedback.name) {
                        // Feedback exists for today
                    } else {
                        // No feedback found for today
                        self.dialog_box(); // Show dialog box if feedback for today does not exist
                    }
                    });
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
                    fieldname: "lookingForward",
                    in_list_view: 1,
                    reqd: 1, // Required field
                },
                {
                    fieldtype: "Column Break",
                },
                {
                    fieldtype: "Small Text",
                    label: __("What challenge will you tackle today?"),
                    fieldname: "todaysChallenge",
                    in_list_view: 1,
                    reqd: 1, // Required field
                    default:""
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
        this.createRecord(values.lookingForward,values.todaysChallenge);
        
        // Hide the dialog after submission
        this.dialog.hide();
    }

    createRecord(lookingForward,todaysChallenge) {
        var self = this;
        
        // Example: Use frappe.call or any backend API to create a record
        frappe.call({
            method: "phamos.phamos.doctype.have_a_great_day.have_a_great_day.create_todays_feedback",
            args: {
                lookingForward:lookingForward,
                todaysChallenge:todaysChallenge
               
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
