function FormData({participants, activeTab, duration, zipCode, therapists, eventType}) {

    return (  
        <div>
            <p>{activeTab}: {participants} {zipCode}, {duration}, {therapists}, {eventType} </p>
            <p>{activeTab}: {therapists}, {zipCode}, {duration},  {eventType} </p>
            
        </div>
    );
}

export default FormData;