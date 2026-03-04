const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestCustomer() {
    const { data, error } = await supabase
        .from('customers')
        .insert({
            first_name: 'Max',
            last_name: 'Zwei-Telefone',
            email: 'max.zweitelefone@test.com',
            phone: '0151-1234567',
            phone_2: '089-9876543',
            street: 'Musterstraße',
            house_number: '1',
            postal_code: '80331',
            city: 'München',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating test customer:', error);
    } else {
        console.log('Successfully created test customer:', data);
    }
}

createTestCustomer();
