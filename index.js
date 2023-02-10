const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');

// Construct a schema, using GraphQL schema language
const schema = buildSchema(`
  type Query { 
    pizzaSales(startDate: String, endDate: String, pizza: [String], period: Int): PizzaSales
    ingredientCost(startDate: String, endDate: String, pizza: [String], period: Int): IngredientCost
  }
  type PizzaSales {
    totalSales: Int
    salesByWeek: [SalesByWeek]
  }
  type SalesByWeek {
    startDate: String
    endDate: String
    sales: Int
  }
  type IngredientCost {
    totalCost: Int
    costByWeek: [CostByWeek]
  }
  type CostByWeek {
    startDate: String
    endDate: String
    cost: Int
  }
`);

// The root provides a resolver function for each API endpoint
const root = {
    pizzaSales: (args) => {
        // Retrieve data from database
        const { startDate, endDate, pizza, period } = args;
        let query = `SELECT * FROM pizza_sales WHERE date BETWEEN '${startDate}' AND '${endDate}'`;
        if (pizza.length > 0) {
            query += ` AND pizza IN (${pizza.map(p => `'${p}'`).join(',')})`;
        }

        const salesData = database.query(query);

        // Calculate total sales
        let totalSales = 0;
        salesData.forEach(sale => {
            totalSales += sale.quantity;
        });

        // Calculate sales by week
        let salesByWeek = [];
        let currentWeekStartDate = startDate;
        let currentWeekEndDate = null;
        let currentWeekSales = 0;
        salesData.forEach(sale => {
            if (sale.date > currentWeekEndDate) {
                if (currentWeekStartDate !== startDate) {
                    salesByWeek.push({
                        startDate: currentWeekStartDate,
                        endDate: currentWeekEndDate,
                        sales: currentWeekSales
                    });
                }
                currentWeekStartDate = sale.date;
                currentWeekEndDate = sale.date + period;
                currentWeekSales = 0;
            }
            currentWeekSales += sale.quantity;
        });
        salesByWeek.push({
            startDate: currentWeekStartDate,
            endDate: currentWeekEndDate,
            sales: currentWeekSales
        });

        return {
            totalSales,
            salesByWeek
        };
    },
    ingredientCost: (args) => {
        // Retrieve data from database
        const { startDate, endDate, pizza, period } = args;
        let query = `SELECT * FROM ingredient_cost WHERE date BETWEEN '${startDate}' AND '${endDate}'`;
        if (pizza.length > 0) {
            query += ` AND pizza IN (${pizza.map(p => `'${p}'`).join(',')})`;
        }

        const costData = database.query(query);

        // Calculate total cost
        let totalCost = 0;
        costData.forEach(cost => {
            totalCost += cost.amount;
        });

        // Calculate cost by week
        let costByWeek = [];
        let currentWeekStartDate = startDate;
        let currentWeekEndDate = null;
        let currentWeekCost = 0;
        costData.forEach(cost => {
            if (cost.date > currentWeekEndDate) {
                if (currentWeekStartDate !== startDate) {
                    costByWeek.push({
                        startDate: currentWeekStartDate,
                        endDate: currentWeekEndDate,
                        cost: currentWeekCost
                    });
                }
                currentWeekStartDate = cost.date;
                currentWeekEndDate = cost.date + period;
                currentWeekCost = 0;
            }
            currentWeekCost += cost.amount;
        });
        costByWeek.push({
            startDate: currentWeekStartDate,
            endDate: currentWeekEndDate,
            cost: currentWeekCost
        });

        return {
            totalCost,
            costByWeek
        };
    }
};

const app = express();

app.use(
    '/graphql',
    graphqlHTTP({
        schema: schema,
        rootValue: root,
        graphiql: true,
    })
);
app.listen(4000);
console.log('Running a GraphQL API server at localhost:4000/graphql');