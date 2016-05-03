
function Machine(payload) {
    var self = this;
    self.config = JSON.parse(payload);
};

var ViewModel = function () {
    var self = this;
    var creds = _creds;
    self.Input = ko.observable();
    self.Output = ko.observable();
    self.Machines = ko.observableArray();
    self.broker = ko.observable();
    self.username = ko.observable();
    self.password = ko.observable();
    self.broker((creds && creds.broker) ? creds.broker.host : "broker");
    self.username((creds && creds.broker) ? creds.broker.username : "admin");
    self.password((creds && creds.broker) ? creds.broker.password : "");
    var command = {
        command: "hostname"
    };
    self.Command = ko.observable(JSON.stringify(command, null, 4));

    self.CurrentNode = ko.observable();
    //var broker = data.broker;
    function Subscribe() {
        // Create a client instance
        client = new Paho.MQTT.Client(self.broker(), 1884, "clientId");

        // set callback handlers
        client.onConnectionLost = onConnectionLost;
        client.onMessageArrived = onMessageArrived;

        // connect the client
        client.connect({ onSuccess: onConnect, userName: self.username(), password: self.password() });


        // called when the client connects
        function onConnect() {
            // Once a connection has been made, make a subscription and send a message.
            console.log("onConnect");
            client.subscribe("client/+/config");

            //message = new Paho.MQTT.Message("Hello");
            //message.destinationName = "/world";
            //client.send(message);
        }

        // called when the client loses its connection
        function onConnectionLost(responseObject) {
            if (responseObject.errorCode !== 0) {
                console.log("onConnectionLost:" + responseObject.errorMessage);
            }
        }

        // called when a message arrives
        function onMessageArrived(message) {
            if (message.destinationName.indexOf("config") > -1) {
                var msg = new Machine(message.payloadString);
                self.Machines.push(msg);
                self.onNodeClick(msg);
            }

            if (message.destinationName.indexOf("output") > -1) {
                self.Output(self.Output() + message.payloadString);
            }
            console.log("onMessageArrived: (" + message.destinationName + ")" + message.payloadString);
        }
        return client;

    }
    self.authVisible = ko.observable(true);
    self.cmdVisible = ko.observable(false);

    self.Login = function () {
        self.Machines.removeAll();
        self.client = Subscribe();
        self.cmdVisible(true)
    }


    self.Send = function () {

        var msg = new Paho.MQTT.Message(self.Command());
        msg.destinationName = self.CurrentNode();
        self.client.send(msg);
        self.Output(self.Output() + "\n");
    };

    var currentSubscriptions = [];
    self.onNodeClick = function (machine) {

        currentSubscriptions.forEach(function (sub) {
            self.client.unsubscribe(sub);
        });
        self.Output("");
        //self.Input("");
        self.CurrentNode(machine.config.hostname);
        self.client.subscribe(machine.config.hostname);
        self.client.subscribe(machine.config.hostname + "/output");
    };

};

$(document).ready(function () {
    ko.applyBindings(new ViewModel());
});

